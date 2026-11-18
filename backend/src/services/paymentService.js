import Stripe from 'stripe';
import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import InventoryNight from '../models/InventoryNight.js';
import ApiError from '../utils/ApiError.js';
import { writeAuditLog } from './auditService.js';

function getStripe(env) {
  if (!env.STRIPE_SECRET_KEY) throw new ApiError(503, 'Payments are not configured');
  return new Stripe(env.STRIPE_SECRET_KEY);
}

export async function createPaymentIntent({ bookingReference, idempotencyKey, user, env }) {
  const stripe = getStripe(env);
  const booking = await Booking.findOne({ reference: bookingReference, customer: user._id });
  if (!booking) throw new ApiError(404, 'Booking was not found');
  if (booking.status !== 'pending' || !booking.holdExpiresAt || booking.holdExpiresAt <= new Date()) {
    throw new ApiError(409, 'This booking is not eligible for payment');
  }
  let payment = await Payment.findOne({ idempotencyKey });
  if (payment) {
    if (String(payment.booking) !== String(booking._id) || String(payment.customer) !== String(user._id)) {
      throw new ApiError(409, 'Idempotency key has already been used');
    }
    if (payment.providerIntentId) {
      if (payment.status !== 'pending') throw new ApiError(409, 'This payment is no longer pending');
      const intent = await stripe.paymentIntents.retrieve(payment.providerIntentId);
      return { payment, clientSecret: intent.client_secret };
    }
  } else {
    const existingPayment = await Payment.findOne({ booking: booking._id });
    if (existingPayment) throw new ApiError(409, 'A payment has already been initiated for this booking');
    try {
      [payment] = await Payment.create([{
        booking: booking._id,
        customer: user._id,
        provider: 'stripe',
        amount: booking.pricing.total,
        currency: booking.currency,
        idempotencyKey,
      }]);
    } catch (error) {
      if (error.code !== 11000) throw error;
      payment = await Payment.findOne({ booking: booking._id }).select('+idempotencyKey');
      if (!payment || payment.idempotencyKey !== idempotencyKey) {
        throw new ApiError(409, 'A payment has already been initiated for this booking');
      }
    }
  }
  try {
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(booking.pricing.total * 100),
      currency: booking.currency.toLowerCase(),
      metadata: { bookingReference: booking.reference, paymentId: String(payment._id) },
      automatic_payment_methods: { enabled: true },
    }, { idempotencyKey });
    payment.providerIntentId = intent.id;
    payment.status = 'pending';
    await payment.save();
    booking.paymentStatus = 'pending';
    await booking.save();
    return { payment, clientSecret: intent.client_secret };
  } catch (error) {
    payment.status = 'failed';
    await payment.save();
    console.error('Stripe payment intent creation failed', { name: error.name });
    throw new ApiError(502, 'The payment provider could not initialize this payment');
  }
}

export async function processStripeEvent(event) {
  const providerObject = event.data.object;
  const intentId = event.type === 'charge.refunded'
    ? (typeof providerObject.payment_intent === 'string' ? providerObject.payment_intent : providerObject.payment_intent?.id)
    : providerObject.id;
  const payment = await Payment.findOne({ providerIntentId: intentId });
  if (!payment || payment.processedWebhookIds.includes(event.id)) return;

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const marker = await Payment.updateOne({
        _id: payment._id,
        processedWebhookIds: { $ne: event.id },
      }, {
        $addToSet: { processedWebhookIds: event.id },
      }, { session });
      if (marker.modifiedCount === 0) return;

      const currentPayment = await Payment.findById(payment._id).session(session);
      if (!currentPayment) return;
      const booking = await Booking.findById(currentPayment.booking).session(session);
      if (!booking) throw new ApiError(404, 'Payment booking was not found');

      if (event.type === 'payment_intent.succeeded') {
        if (!['refunded', 'partially_refunded'].includes(currentPayment.status)) {
          currentPayment.status = 'succeeded';
          booking.paymentStatus = 'paid';
        }
        if (booking.status === 'pending' && booking.holdExpiresAt > new Date()) {
          booking.status = 'confirmed';
          booking.holdExpiresAt = undefined;
          await InventoryNight.updateMany({ booking: booking._id }, { $unset: { holdExpiresAt: 1 } }, { session });
        } else if (booking.status !== 'confirmed') {
          booking.status = 'cancelled';
          await InventoryNight.deleteMany({ booking: booking._id }, { session });
        }
      } else if (event.type === 'payment_intent.payment_failed') {
        if (!['succeeded', 'refunded', 'partially_refunded'].includes(currentPayment.status)) {
          currentPayment.status = 'failed';
          booking.paymentStatus = 'failed';
          if (booking.status === 'pending') {
            booking.status = 'cancelled';
            await InventoryNight.deleteMany({ booking: booking._id }, { session });
          }
        }
      } else if (event.type === 'charge.refunded') {
        const refundedAmount = Number(providerObject.amount_refunded || 0) / 100;
        currentPayment.refundedAmount = refundedAmount;
        currentPayment.status = refundedAmount >= currentPayment.amount ? 'refunded' : 'partially_refunded';
        booking.paymentStatus = currentPayment.status;
      }
      await currentPayment.save({ session });
      await booking.save({ session });
      await writeAuditLog({
        actor: currentPayment.customer,
        action: `payment.${event.type.replaceAll('.', '_')}`,
        resourceType: 'payment',
        resourceId: currentPayment._id,
        metadata: { providerEventId: event.id },
      }, { session });
    });
  } finally {
    await session.endSession();
  }
}

export async function refundPayment(payment, env, amount) {
  if (payment.status !== 'succeeded' && payment.status !== 'partially_refunded') {
    throw new ApiError(409, 'Only successful payments can be refunded');
  }
  const remaining = payment.amount - payment.refundedAmount;
  if (amount !== undefined && (!Number.isFinite(amount) || amount <= 0 || amount > remaining)) {
    throw new ApiError(400, 'Refund amount is invalid');
  }
  const stripe = getStripe(env);
  try {
    await stripe.refunds.create({
      payment_intent: payment.providerIntentId,
      ...(amount === undefined ? {} : { amount: Math.round(amount * 100) }),
    }, { idempotencyKey: `refund:${payment._id}:${payment.refundedAmount}:${amount ?? 'full'}` });
  } catch (error) {
    console.error('Stripe refund request failed', { name: error.name });
    throw new ApiError(502, 'The payment provider could not submit this refund');
  }
  return payment;
}
