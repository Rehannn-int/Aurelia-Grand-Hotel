import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { pagination, sendSuccess } from '../utils/response.js';
import { writeAuditLog } from '../services/auditService.js';

const safeFields = 'name email phone role isActive emailVerified lastLoginAt createdAt';

export const listStaff = asyncHandler(async (req, res) => {
  const queryParams = req.validatedQuery || req.query;
  const { page, limit, skip } = pagination(queryParams);
  const filter = { role: { $in: ['hotel_manager', 'receptionist', 'housekeeping_staff'] } };
  if (queryParams.role) filter.role = queryParams.role;
  if (queryParams.active !== undefined) filter.isActive = queryParams.active === 'true';
  if (queryParams.search) {
    const escaped = queryParams.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [{ name: new RegExp(escaped, 'i') }, { email: new RegExp(escaped, 'i') }];
  }
  const [staff, total] = await Promise.all([
    User.find(filter).select(safeFields).sort({ name: 1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  return sendSuccess(res, staff, 'Staff retrieved successfully', 200, {
    page, limit, total, totalPages: Math.ceil(total / limit),
  });
});

export const createStaff = asyncHandler(async (req, res) => {
  const email = req.body.email.toLowerCase();
  if (await User.exists({ email })) throw new ApiError(409, 'An account with this email already exists');
  const staff = await User.create({
    name: req.body.name,
    email,
    phone: req.body.phone,
    passwordHash: await bcrypt.hash(req.body.password, 12),
    role: req.body.role,
  });
  await writeAuditLog({
    actor: req.user._id,
    action: 'staff.created',
    resourceType: 'user',
    resourceId: staff._id,
    metadata: { role: staff.role },
  });
  return sendSuccess(res, await User.findById(staff._id).select(safeFields), 'Staff account created successfully', 201);
});

export const updateStaff = asyncHandler(async (req, res) => {
  const staff = await User.findOne({
    _id: req.params.id,
    role: { $in: ['hotel_manager', 'receptionist', 'housekeeping_staff'] },
  });
  if (!staff) throw new ApiError(404, 'Staff account was not found');
  if (String(staff._id) === String(req.user._id) && req.body.isActive === false) {
    throw new ApiError(400, 'You cannot deactivate your own account');
  }
  Object.assign(staff, req.body);
  await staff.save();
  await writeAuditLog({
    actor: req.user._id,
    action: 'staff.updated',
    resourceType: 'user',
    resourceId: staff._id,
    metadata: { fields: Object.keys(req.body) },
  });
  return sendSuccess(res, await User.findById(staff._id).select(safeFields), 'Staff account updated successfully');
});
