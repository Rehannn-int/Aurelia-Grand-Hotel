import HotelService from '../models/HotelService.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { writeAuditLog } from '../services/auditService.js';

export const listServices = asyncHandler(async (_req, res) => {
  const services = await HotelService.find({}).sort({ category: 1, name: 1 });
  return sendSuccess(res, services, 'Hotel services retrieved successfully');
});

export const createService = asyncHandler(async (req, res) => {
  const service = await HotelService.create(req.body);
  await writeAuditLog({
    actor: req.user._id,
    action: 'hotel_service.created',
    resourceType: 'hotel_service',
    resourceId: service._id,
  });
  return sendSuccess(res, service, 'Hotel service created successfully', 201);
});

export const updateService = asyncHandler(async (req, res) => {
  const service = await HotelService.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!service) throw new ApiError(404, 'Hotel service was not found');
  await writeAuditLog({
    actor: req.user._id,
    action: 'hotel_service.updated',
    resourceType: 'hotel_service',
    resourceId: service._id,
  });
  return sendSuccess(res, service, 'Hotel service updated successfully');
});

export const deactivateService = asyncHandler(async (req, res) => {
  const service = await HotelService.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
  if (!service) throw new ApiError(404, 'Hotel service was not found');
  await writeAuditLog({
    actor: req.user._id,
    action: 'hotel_service.deactivated',
    resourceType: 'hotel_service',
    resourceId: service._id,
  });
  return sendSuccess(res, service, 'Hotel service deactivated successfully');
});
