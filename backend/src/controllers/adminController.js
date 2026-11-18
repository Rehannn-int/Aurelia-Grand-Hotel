import Booking from '../models/Booking.js';
import Room from '../models/Room.js';
import Payment from '../models/Payment.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, pagination } from '../utils/response.js';

export const dashboard = asyncHandler(async (req, res) => {
  const now = new Date();
  const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dayEnd = new Date(dayStart.getTime() + 86400000);
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const [
    totalRooms,
    operationalRooms,
    occupiedRooms,
    confirmedBookings,
    pendingBookings,
    todaysArrivals,
    todaysDepartures,
    reservedRoomIds,
    paidPayments,
    recentBookings,
  ] = await Promise.all([
    Room.countDocuments({ active: true }),
    Room.countDocuments({ active: true, operationalStatus: { $nin: ['maintenance', 'out_of_service'] } }),
    Booking.distinct('rooms', {
      status: 'checked_in',
      checkIn: { $lt: dayEnd },
      checkOut: { $gt: dayStart },
    }),
    Booking.countDocuments({ status: 'confirmed' }),
    Booking.countDocuments({ status: 'pending', holdExpiresAt: { $gt: now } }),
    Booking.countDocuments({ checkIn: { $gte: dayStart, $lt: dayEnd }, status: { $in: ['confirmed', 'checked_in'] } }),
    Booking.countDocuments({ checkOut: { $gte: dayStart, $lt: dayEnd }, status: { $in: ['checked_in', 'checked_out'] } }),
    Booking.distinct('rooms', {
      checkIn: { $lt: dayEnd },
      checkOut: { $gt: dayStart },
      $or: [
        { status: { $in: ['confirmed', 'checked_in'] } },
        { status: 'pending', holdExpiresAt: { $gt: now } },
      ],
    }),
    Payment.aggregate([
      { $match: { status: { $in: ['succeeded', 'partially_refunded'] }, createdAt: { $gte: monthStart } } },
      { $group: { _id: '$currency', gross: { $sum: '$amount' }, refunded: { $sum: '$refundedAmount' }, payments: { $sum: 1 } } },
    ]),
    Booking.find({}).populate('category').sort({ createdAt: -1 }).limit(8).select('reference guest checkIn checkOut status pricing currency createdAt'),
  ]);
  const currentOccupiedRoomIds = occupiedRooms.filter(Boolean);
  const inventoryRooms = await Room.countDocuments({
    active: true,
    operationalStatus: { $nin: ['maintenance', 'out_of_service'] },
  });
  const [occupiedOperationalRooms, reservedOperationalRoomCount] = await Promise.all([
    Room.countDocuments({
      _id: { $in: currentOccupiedRoomIds },
      active: true,
      operationalStatus: { $nin: ['maintenance', 'out_of_service'] },
    }),
    Room.countDocuments({
      _id: { $in: reservedRoomIds },
      active: true,
      operationalStatus: { $nin: ['maintenance', 'out_of_service'] },
    }),
  ]);
  return sendSuccess(res, {
    totalRooms,
    operationalRooms,
    occupiedRooms: occupiedOperationalRooms,
    availableRooms: Math.max(inventoryRooms - reservedOperationalRoomCount, 0),
    confirmedBookings,
    pendingBookings,
    todaysArrivals,
    todaysDepartures,
    occupancyRate: inventoryRooms ? Math.round((occupiedOperationalRooms / inventoryRooms) * 100) : 0,
    revenueThisMonth: paidPayments.map((row) => ({
      currency: row._id,
      amount: row.gross - row.refunded,
      paymentCount: row.payments,
    })),
    recentBookings,
  }, 'Dashboard summary retrieved successfully');
});

export const guestDirectory = asyncHandler(async (req, res) => {
  const queryParams = req.validatedQuery || req.query;
  const { page, limit, skip } = pagination(queryParams);
  const search = queryParams.search || '';
  const pipeline = [
    { $sort: { createdAt: 1 } },
    { $group: {
      _id: '$guest.email',
      name: { $last: '$guest.name' },
      email: { $last: '$guest.email' },
      phone: { $last: '$guest.phone' },
      bookings: { $sum: 1 },
      lastStay: { $max: '$checkOut' },
    } },
    ...(search ? [{ $match: { $or: [
      { name: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
      { email: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } },
    ] } }] : []),
    { $sort: { lastStay: -1 } },
    { $facet: { data: [{ $skip: skip }, { $limit: limit }], total: [{ $count: 'count' }] } },
  ];
  const [result] = await Booking.aggregate(pipeline);
  const guests = (result?.data || []).map(({ _id, ...guest }) => ({ id: _id, ...guest }));
  const total = result?.total?.[0]?.count || 0;
  return sendSuccess(res, guests, 'Guests retrieved successfully', 200, { page, limit, total, totalPages: Math.ceil(total / limit) });
});

export const reservationReport = asyncHandler(async (req, res) => {
  const queryParams = req.validatedQuery || req.query;
  const { page, limit, skip } = pagination(queryParams);
  const filter = {};
  if (queryParams.startDate || queryParams.endDate) {
    filter.checkIn = {};
    if (queryParams.startDate) filter.checkIn.$gte = new Date(queryParams.startDate);
    if (queryParams.endDate) filter.checkIn.$lt = new Date(new Date(`${queryParams.endDate}T00:00:00.000Z`).getTime() + 86400000);
  }
  if (queryParams.status) filter.status = queryParams.status;
  const [bookings, total] = await Promise.all([
    Booking.find(filter).populate('category', 'name').select('reference guest category checkIn checkOut status paymentStatus pricing currency').sort({ checkIn: -1 }).skip(skip).limit(limit),
    Booking.countDocuments(filter),
  ]);
  return sendSuccess(res, bookings, 'Reservation report retrieved successfully', 200, { page, limit, total, totalPages: Math.ceil(total / limit) });
});

export const revenueReport = asyncHandler(async (req, res) => {
  const queryParams = req.validatedQuery || req.query;
  const { page, limit, skip } = pagination(queryParams);
  const filter = {
    status: queryParams.status
      ? queryParams.status
      : { $in: ['succeeded', 'partially_refunded', 'refunded'] },
  };
  if (queryParams.startDate || queryParams.endDate) {
    filter.createdAt = {};
    if (queryParams.startDate) filter.createdAt.$gte = new Date(queryParams.startDate);
    if (queryParams.endDate) filter.createdAt.$lt = new Date(new Date(`${queryParams.endDate}T00:00:00.000Z`).getTime() + 86400000);
  }
  const [payments, total] = await Promise.all([
    Payment.find(filter).populate('booking', 'reference').populate('customer', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Payment.countDocuments(filter),
  ]);
  const data = payments.map((payment) => ({
    ...payment.toJSON(),
    netAmount: Math.max(payment.amount - payment.refundedAmount, 0),
  }));
  return sendSuccess(res, data, 'Revenue report retrieved successfully', 200, { page, limit, total, totalPages: Math.ceil(total / limit) });
});
