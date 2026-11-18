import Payment from '../models/Payment.js';
import Stripe from 'stripe';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { pagination, sendSuccess } from '../utils/response.js';
import { createPaymentIntent, processStripeEvent, refundPayment } from '../services/paymentService.js';
import { writeAuditLog } from '../services/auditService.js';

export const createIntent = asyncHandler(async (req, res) => {
  const { payment, clientSecret } = await createPaymentIntent({
    bookingReference: req.body.bookingReference,
    idempotencyKey: req.get('idempotency-key'),
    user: req.user,
    env: req.app.locals.env,
  });
  return sendSuccess(res, { payment, clientSecret }, 'Payment session created');
});

export const webhook = asyncHandler(async (req, res) => {
  const env = req.app.locals.env;
  if (!env.STRIPE_WEBHOOK_SECRET || !env.STRIPE_SECRET_KEY) throw new ApiError(503, 'Payment webhooks are not configured');
  const client = new Stripe(env.STRIPE_SECRET_KEY);
  let event;
  try {
    event = client.webhooks.constructEvent(req.body, req.get('stripe-signature'), env.STRIPE_WEBHOOK_SECRET);
  } catch {
    throw new ApiError(400, 'Invalid payment webhook signature');
  }
  if (['payment_intent.succeeded', 'payment_intent.payment_failed', 'charge.refunded'].includes(event.type)) {
    await processStripeEvent(event);
  }
  return res.status(200).json({ received: true });
});

export const myPayments = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pagination(req.query);
  const query = { customer: req.user._id };
  const [payments, total] = await Promise.all([
    Payment.find(query).populate('booking', 'reference status checkIn checkOut').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Payment.countDocuments(query),
  ]);
  return sendSuccess(res, payments, 'Payments retrieved successfully', 200, { page, limit, total, totalPages: Math.ceil(total / limit) });
});

export const adminPayments = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pagination(req.query);
  const query = req.validatedQuery || req.query;
  const filter = query.status ? { status: query.status } : {};
  const [payments, total] = await Promise.all([
    Payment.find(filter).populate('customer', 'name email').populate('booking', 'reference status').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Payment.countDocuments(filter),
  ]);
  return sendSuccess(res, payments, 'Payments retrieved successfully', 200, { page, limit, total, totalPages: Math.ceil(total / limit) });
});

export const refund = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) throw new ApiError(404, 'Payment was not found');
  await refundPayment(payment, req.app.locals.env, req.body.amount);
  await writeAuditLog({
    actor: req.user._id,
    action: 'payment.refund_requested',
    resourceType: 'payment',
    resourceId: payment._id,
  });
  return sendSuccess(res, payment, 'Refund request submitted; final status will follow the provider webhook');
});
