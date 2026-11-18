import mongoose from 'mongoose';
import { createHash, randomBytes } from 'node:crypto';
import Booking from '../models/Booking.js';
import InventoryNight from '../models/InventoryNight.js';
import Room from '../models/Room.js';
import ApiError from '../utils/ApiError.js';
import { enumerateStayNights } from '../utils/dateUtils.js';
import { quoteBooking } from './pricingService.js';
import { findAvailableRooms } from './availabilityService.js';
import { writeAuditLog } from './auditService.js';

function bookingReference() {
  return `AG-${randomBytes(5).toString('hex').toUpperCase()}`;
}

function isTransactionUnavailable(error) {
  return /Transaction numbers are only allowed|replica set|does not support transactions/i.test(error.message || '');
}

export async function createBooking(input, { customer, currency, source = 'web', idempotencyKey }) {
  const requestFingerprint = createHash('sha256').update(JSON.stringify(input)).digest('hex');
  const priorBooking = await Booking.findOne({ idempotencyKey })
    .select('+idempotencyKey +requestFingerprint');
  if (priorBooking) {
    if (String(priorBooking.customer) !== String(customer) || priorBooking.requestFingerprint !== requestFingerprint) {
      throw new ApiError(409, 'Idempotency key has already been used');
    }
    return Booking.findById(priorBooking._id).populate('category rooms');
  }
  const quote = await quoteBooking(input);
  const session = await mongoose.startSession();
  const holdExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
  let createdBooking;

  try {
    await session.withTransaction(async () => {
      const available = await findAvailableRooms({
        categoryId: quote.category._id,
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        adults: input.adults,
        children: input.children || 0,
        roomCount: input.roomCount,
        session,
      });
      if (available.length < input.roomCount) throw new ApiError(409, 'The selected room inventory is no longer available');

      const assignedRooms = available.slice(0, input.roomCount);
      const roomLock = await Room.updateMany({
        _id: { $in: assignedRooms.map((room) => room._id) },
        active: true,
        operationalStatus: { $nin: ['maintenance', 'out_of_service'] },
      }, { $inc: { reservationVersion: 1 } }, { session });
      if (roomLock.modifiedCount !== input.roomCount) {
        throw new ApiError(409, 'The selected room inventory is no longer available');
      }
      const [booking] = await Booking.create([{
        reference: bookingReference(),
        idempotencyKey,
        requestFingerprint,
        customer,
        guest: {
          name: input.guestName,
          email: input.email.toLowerCase(),
          phone: input.phone || '',
        },
        rooms: assignedRooms.map((room) => room._id),
        category: quote.category._id,
        checkIn: new Date(`${input.checkIn}T00:00:00.000Z`),
        checkOut: new Date(`${input.checkOut}T00:00:00.000Z`),
        adults: input.adults,
        children: input.children || 0,
        roomCount: input.roomCount,
        nightCount: quote.nights,
        pricing: quote.pricing,
        currency,
        status: 'pending',
        paymentStatus: 'unpaid',
        specialRequests: input.specialRequests || '',
        source,
        holdExpiresAt,
      }], { session });

      const stayNights = enumerateStayNights(input.checkIn, input.checkOut);
      await InventoryNight.insertMany(assignedRooms.flatMap((room) => stayNights.map((night) => ({
        room: room._id,
        night,
        booking: booking._id,
        holdExpiresAt,
      }))), { session });
      await writeAuditLog({
        actor: customer,
        action: 'booking.created',
        resourceType: 'booking',
        resourceId: booking._id,
        metadata: { source, roomCount: input.roomCount },
      }, { session });
      createdBooking = booking;
    });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.idempotencyKey) {
      const duplicate = await Booking.findOne({ idempotencyKey })
        .select('+idempotencyKey +requestFingerprint');
      if (duplicate && String(duplicate.customer) === String(customer) && duplicate.requestFingerprint === requestFingerprint) {
        createdBooking = duplicate;
      } else {
        throw new ApiError(409, 'Idempotency key has already been used');
      }
    } else if (error.code === 11000 || error.code === 112 || error.code === 251) {
      throw new ApiError(409, 'The selected room inventory is no longer available');
    } else if (isTransactionUnavailable(error)) {
      throw new ApiError(503, 'Booking creation requires MongoDB transactions; configure MongoDB as a replica set');
    } else {
      throw error;
    }
  } finally {
    await session.endSession();
  }

  return Booking.findById(createdBooking._id).populate('category rooms');
}

export async function cancelBooking(booking, actor) {
  if (!['pending', 'confirmed'].includes(booking.status)) {
    throw new ApiError(409, 'This booking can no longer be cancelled');
  }
  if (booking.status === 'confirmed' && booking.paymentStatus === 'paid') {
    throw new ApiError(409, 'Paid bookings require staff-assisted cancellation and refund processing');
  }
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      booking.status = 'cancelled';
      booking.cancellation = { cancelledAt: new Date(), cancelledBy: actor._id };
      booking.holdExpiresAt = undefined;
      await booking.save({ session });
      await InventoryNight.deleteMany({ booking: booking._id }, { session });
      await writeAuditLog({
        actor: actor._id,
        action: 'booking.cancelled',
        resourceType: 'booking',
        resourceId: booking._id,
      }, { session });
    });
  } catch (error) {
    if (isTransactionUnavailable(error)) throw new ApiError(503, 'Booking changes require MongoDB transactions; configure MongoDB as a replica set');
    throw error;
  } finally {
    await session.endSession();
  }
  return booking;
}

export async function changeBookingStatus(booking, nextStatus, actor) {
  const transitions = {
    pending: ['confirmed', 'cancelled', 'no_show'],
    confirmed: ['checked_in', 'cancelled', 'no_show'],
    checked_in: ['checked_out'],
    checked_out: [],
    cancelled: [],
    no_show: [],
  };
  if (!transitions[booking.status]?.includes(nextStatus)) throw new ApiError(409, 'Invalid booking status transition');
  if (nextStatus === 'confirmed' && booking.paymentStatus !== 'paid') {
    throw new ApiError(409, 'A booking cannot be confirmed before payment is verified');
  }
  if (nextStatus === 'cancelled' && booking.paymentStatus === 'paid') {
    throw new ApiError(409, 'Paid bookings require refund processing before cancellation');
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const previousStatus = booking.status;
      booking.status = nextStatus;
      if (nextStatus === 'confirmed') {
        booking.holdExpiresAt = undefined;
        await InventoryNight.updateMany({ booking: booking._id }, { $unset: { holdExpiresAt: 1 } }, { session });
      }
      await booking.save({ session });
      if (nextStatus === 'cancelled' || nextStatus === 'checked_out' || nextStatus === 'no_show') {
        await InventoryNight.deleteMany({ booking: booking._id }, { session });
      }
      await writeAuditLog({
        actor: actor._id,
        action: 'booking.status_changed',
        resourceType: 'booking',
        resourceId: booking._id,
        metadata: { from: previousStatus, to: nextStatus },
      }, { session });
    });
  } catch (error) {
    if (isTransactionUnavailable(error)) throw new ApiError(503, 'Booking changes require MongoDB transactions; configure MongoDB as a replica set');
    throw error;
  } finally {
    await session.endSession();
  }
  return booking;
}
