import Booking from '../models/Booking.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, pagination } from '../utils/response.js';
import { quoteBooking } from '../services/pricingService.js';
import { createBooking, cancelBooking, changeBookingStatus } from '../services/bookingService.js';
import { findAvailableRooms } from '../services/availabilityService.js';

export const quote = asyncHandler(async (req, res) => {
  const result = await quoteBooking(req.body);
  const rooms = await findAvailableRooms({
    categoryId: result.category._id,
    checkIn: req.body.checkIn,
    checkOut: req.body.checkOut,
    adults: req.body.adults,
    children: req.body.children || 0,
    roomCount: req.body.roomCount,
  });
  return sendSuccess(res, {
    category: result.category,
    nights: result.nights,
    pricing: result.pricing,
    currency: req.app.locals.env.DEFAULT_CURRENCY,
    available: rooms.length >= req.body.roomCount,
  }, 'Booking quote created successfully');
});

export const create = asyncHandler(async (req, res) => {
  const booking = await createBooking(req.body, {
    customer: req.user?._id,
    currency: req.app.locals.env.DEFAULT_CURRENCY,
    idempotencyKey: req.idempotencyKey,
  });
  return sendSuccess(res, booking, 'Booking request created; payment is required to confirm it', 201);
});

export const myBookings = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pagination(req.query);
  const [bookings, total] = await Promise.all([
    Booking.find({ customer: req.user._id }).populate('rooms category').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Booking.countDocuments({ customer: req.user._id }),
  ]);
  return sendSuccess(res, bookings, 'Bookings retrieved successfully', 200, { page, limit, total, totalPages: Math.ceil(total / limit) });
});

export const cancelMine = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, customer: req.user._id });
  if (!booking) throw new ApiError(404, 'Booking was not found');
  await cancelBooking(booking, req.user);
  return sendSuccess(res, booking, 'Booking cancelled successfully');
});

export const listAdminBookings = asyncHandler(async (req, res) => {
  const queryParams = req.validatedQuery || req.query;
  const { page, limit, skip } = pagination(queryParams);
  const query = {};
  if (queryParams.status) query.status = queryParams.status;
  if (queryParams.startDate || queryParams.endDate) {
    query.checkIn = {};
    if (queryParams.startDate) query.checkIn.$gte = new Date(`${queryParams.startDate}T00:00:00.000Z`);
    if (queryParams.endDate) query.checkIn.$lt = new Date(new Date(`${queryParams.endDate}T00:00:00.000Z`).getTime() + 86400000);
  }
  if (queryParams.search) {
    const safeSearch = queryParams.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = [
      { reference: new RegExp(safeSearch, 'i') },
      { 'guest.name': new RegExp(safeSearch, 'i') },
      { 'guest.email': new RegExp(safeSearch, 'i') },
    ];
  }
  const sortField = queryParams.sort?.replace('-', '') || 'createdAt';
  const sort = { [sortField]: queryParams.sort?.startsWith('-') ? -1 : 1 };
  const [bookings, total] = await Promise.all([
    Booking.find(query).populate('customer', 'name email').populate('rooms category').sort(sort).skip(skip).limit(limit),
    Booking.countDocuments(query),
  ]);
  return sendSuccess(res, bookings, 'Bookings retrieved successfully', 200, { page, limit, total, totalPages: Math.ceil(total / limit) });
});

export const updateAdminStatus = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new ApiError(404, 'Booking was not found');
  await changeBookingStatus(booking, req.body.status, req.user);
  return sendSuccess(res, booking, 'Booking status updated successfully');
});
