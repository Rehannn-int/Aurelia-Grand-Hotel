import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Room from '../models/Room.js';
import RoomCategory from '../models/RoomCategory.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { pagination, sendSuccess } from '../utils/response.js';
import { findAvailableRooms } from '../services/availabilityService.js';
import { writeAuditLog } from '../services/auditService.js';

function safePattern(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function buildRoomFilter(params, includeInactive = false) {
  const roomQuery = includeInactive ? {} : { active: true };
  const categoryQuery = includeInactive ? {} : { active: true };
  if (params.category) {
    const categoryMatches = [{ slug: params.category }];
    if (mongoose.isValidObjectId(params.category)) categoryMatches.push({ _id: params.category });
    categoryQuery.$or = categoryMatches;
  }
  if (params.minPrice !== undefined || params.maxPrice !== undefined) {
    categoryQuery.basePrice = {};
    if (params.minPrice !== undefined) categoryQuery.basePrice.$gte = params.minPrice;
    if (params.maxPrice !== undefined) categoryQuery.basePrice.$lte = params.maxPrice;
  }
  if (params.occupancy !== undefined) categoryQuery.maxOccupancy = { $gte: params.occupancy };
  if (params.amenity) categoryQuery.amenities = params.amenity;

  if (Object.keys(categoryQuery).length > (includeInactive ? 0 : 1)) {
    const categories = await RoomCategory.find(categoryQuery).select('_id');
    roomQuery.category = { $in: categories.map(({ _id }) => _id) };
  }
  if (params.search) {
    const escaped = safePattern(params.search);
    roomQuery.$or = [{ roomNumber: new RegExp(escaped, 'i') }, { description: new RegExp(escaped, 'i') }];
  }
  return roomQuery;
}

export const listRooms = asyncHandler(async (req, res) => {
  const queryParams = req.validatedQuery;
  const { page, limit, skip } = pagination(queryParams);
  const query = { active: true };
  if (queryParams.category) {
    query.$or = [{ slug: queryParams.category }];
    if (mongoose.isValidObjectId(queryParams.category)) query.$or.push({ _id: queryParams.category });
  }
  if (queryParams.minPrice !== undefined || queryParams.maxPrice !== undefined) {
    query.basePrice = {};
    if (queryParams.minPrice !== undefined) query.basePrice.$gte = queryParams.minPrice;
    if (queryParams.maxPrice !== undefined) query.basePrice.$lte = queryParams.maxPrice;
  }
  if (queryParams.occupancy !== undefined) query.maxOccupancy = { $gte: queryParams.occupancy };
  if (queryParams.amenity) query.amenities = queryParams.amenity;
  if (queryParams.search) {
    const escaped = safePattern(queryParams.search);
    query.$and = [{ $or: [{ name: new RegExp(escaped, 'i') }, { description: new RegExp(escaped, 'i') }] }];
  }
  const sortField = ['basePrice', 'createdAt'].includes(queryParams.sort.replace('-', ''))
    ? queryParams.sort.replace('-', '')
    : 'name';
  const sort = { [sortField]: queryParams.sort.startsWith('-') ? -1 : 1 };
  const [categories, total] = await Promise.all([
    RoomCategory.find(query).sort(sort).skip(skip).limit(limit),
    RoomCategory.countDocuments(query),
  ]);
  const roomCounts = await Room.aggregate([
    {
      $match: {
        active: true,
        category: { $in: categories.map((category) => category._id) },
        operationalStatus: { $nin: ['maintenance', 'out_of_service'] },
      },
    },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);
  const countsByCategory = new Map(roomCounts.map((item) => [String(item._id), item.count]));
  const publicCategories = categories.map((category) => ({
    ...category.toJSON(),
    operationalRoomCount: countsByCategory.get(String(category._id)) || 0,
  }));
  return sendSuccess(res, publicCategories, 'Rooms retrieved successfully', 200, {
    page, limit, total, totalPages: Math.ceil(total / limit),
  });
});

export const listCategories = asyncHandler(async (req, res) => {
  const categories = await RoomCategory.find({ active: true }).sort({ name: 1 });
  return sendSuccess(res, categories, 'Room categories retrieved successfully');
});

export const listAdminCategories = asyncHandler(async (_req, res) => {
  const categories = await RoomCategory.find({ active: true }).sort({ name: 1 });
  const roomCounts = await Room.aggregate([
    {
      $match: {
        active: true,
        category: { $in: categories.map((category) => category._id) },
      },
    },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);
  const countsByCategory = new Map(roomCounts.map((item) => [String(item._id), item.count]));
  return sendSuccess(res, categories.map((category) => ({
    ...category.toJSON(),
    operationalRoomCount: countsByCategory.get(String(category._id)) || 0,
  })), 'Room categories retrieved successfully');
});

export const availability = asyncHandler(async (req, res) => {
  const query = req.validatedQuery;
  const category = query.categoryId
    ? await RoomCategory.findById(query.categoryId)
    : query.categorySlug ? await RoomCategory.findOne({ slug: query.categorySlug, active: true }) : null;
  if ((query.categoryId || query.categorySlug) && !category) throw new ApiError(404, 'Room category was not found');
  const rooms = await findAvailableRooms({
    categoryId: category?._id,
    checkIn: query.checkIn,
    checkOut: query.checkOut,
    adults: query.adults,
    children: query.children,
    roomCount: query.roomCount,
  });
  return sendSuccess(res, {
    available: rooms.length >= query.roomCount,
    count: rooms.length,
  }, 'Availability checked successfully');
});

export const createRoom = asyncHandler(async (req, res) => {
  if (!await RoomCategory.exists({ _id: req.body.category, active: true })) throw new ApiError(400, 'An active room category is required');
  const room = await Room.create(req.body);
  await writeAuditLog({
    actor: req.user._id,
    action: 'room.created',
    resourceType: 'room',
    resourceId: room._id,
  });
  return sendSuccess(res, room, 'Room created successfully', 201);
});

export const updateRoom = asyncHandler(async (req, res) => {
  if (req.body.category && !await RoomCategory.exists({ _id: req.body.category, active: true })) {
    throw new ApiError(400, 'An active room category is required');
  }
  const session = await mongoose.startSession();
  let room;
  try {
    await session.withTransaction(async () => {
      room = await Room.findById(req.params.id).session(session);
      if (!room) throw new ApiError(404, 'Room was not found');
      const restrictsInventory = req.body.active === false
        || ['maintenance', 'out_of_service'].includes(req.body.operationalStatus);
      if (restrictsInventory) {
        const blockingBooking = await Booking.exists({
          rooms: room._id,
          checkOut: { $gt: new Date() },
          $or: [
            { status: { $in: ['confirmed', 'checked_in'] } },
            { status: 'pending', holdExpiresAt: { $gt: new Date() } },
          ],
        }).session(session);
        if (blockingBooking) throw new ApiError(409, 'Room has an active reservation and cannot be taken out of service');
      }
      Object.assign(room, req.body);
      await room.save({ session });
      await writeAuditLog({
        actor: req.user._id,
        action: 'room.updated',
        resourceType: 'room',
        resourceId: room._id,
      }, { session });
    });
  } catch (error) {
    if (/Transaction numbers are only allowed|replica set|does not support transactions/i.test(error.message || '')) {
      throw new ApiError(503, 'Room changes require MongoDB transactions; configure MongoDB as a replica set');
    }
    throw error;
  } finally {
    await session.endSession();
  }
  await room.populate('category');
  return sendSuccess(res, room, 'Room updated successfully');
});

export const deactivateRoom = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  let room;
  try {
    await session.withTransaction(async () => {
      room = await Room.findById(req.params.id).session(session);
      if (!room) throw new ApiError(404, 'Room was not found');
      const blockingBooking = await Booking.exists({
        rooms: room._id,
        checkOut: { $gt: new Date() },
        $or: [
          { status: { $in: ['confirmed', 'checked_in'] } },
          { status: 'pending', holdExpiresAt: { $gt: new Date() } },
        ],
      }).session(session);
      if (blockingBooking) throw new ApiError(409, 'Room has an active reservation and cannot be deactivated');
      room.active = false;
      await room.save({ session });
      await writeAuditLog({
        actor: req.user._id,
        action: 'room.deactivated',
        resourceType: 'room',
        resourceId: room._id,
      }, { session });
    });
  } catch (error) {
    if (/Transaction numbers are only allowed|replica set|does not support transactions/i.test(error.message || '')) {
      throw new ApiError(503, 'Room changes require MongoDB transactions; configure MongoDB as a replica set');
    }
    throw error;
  } finally {
    await session.endSession();
  }
  return sendSuccess(res, room, 'Room deactivated successfully');
});

export const createCategory = asyncHandler(async (req, res) => {
  const category = await RoomCategory.create(req.body);
  await writeAuditLog({
    actor: req.user._id,
    action: 'room_category.created',
    resourceType: 'room_category',
    resourceId: category._id,
  });
  return sendSuccess(res, category, 'Room category created successfully', 201);
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await RoomCategory.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!category) throw new ApiError(404, 'Room category was not found');
  await writeAuditLog({
    actor: req.user._id,
    action: 'room_category.updated',
    resourceType: 'room_category',
    resourceId: category._id,
  });
  return sendSuccess(res, category, 'Room category updated successfully');
});

export const deactivateCategory = asyncHandler(async (req, res) => {
  const category = await RoomCategory.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
  if (!category) throw new ApiError(404, 'Room category was not found');
  return sendSuccess(res, category, 'Room category deactivated successfully');
});

export const listAdminRooms = asyncHandler(async (req, res) => {
  const queryParams = req.validatedQuery || req.query;
  const { page, limit, skip } = pagination(queryParams);
  const query = await buildRoomFilter(queryParams, true);
  const requestedSortField = queryParams.sort?.replace('-', '');
  const sortField = ['roomNumber', 'createdAt'].includes(requestedSortField) ? requestedSortField : 'roomNumber';
  const sort = { [sortField]: queryParams.sort?.startsWith('-') ? -1 : 1 };
  const [rooms, total] = await Promise.all([
    Room.find(query).populate('category').sort(sort).skip(skip).limit(limit),
    Room.countDocuments(query),
  ]);
  return sendSuccess(res, rooms, 'Rooms retrieved successfully', 200, { page, limit, total, totalPages: Math.ceil(total / limit) });
});
