import HotelSettings from '../models/HotelSettings.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { writeAuditLog } from '../services/auditService.js';

function defaults(env) {
  return {
    hotelName: 'Aurelia Grand',
    contactEmail: '',
    contactPhone: '',
    timezone: env.HOTEL_TIMEZONE,
    currency: env.DEFAULT_CURRENCY,
  };
}

export const publicHotelSettings = asyncHandler(async (req, res) => {
  const settings = await HotelSettings.findById('hotel').select('hotelName timezone currency').lean();
  return sendSuccess(res, settings || {
    hotelName: 'Aurelia Grand',
    timezone: req.app.locals.env.HOTEL_TIMEZONE,
    currency: req.app.locals.env.DEFAULT_CURRENCY,
  }, 'Public settings retrieved successfully');
});

export const getHotelSettings = asyncHandler(async (req, res) => {
  const settings = await HotelSettings.findById('hotel').lean();
  return sendSuccess(res, settings || defaults(req.app.locals.env), 'Hotel settings retrieved successfully');
});

export const updateHotelSettings = asyncHandler(async (req, res) => {
  const settings = await HotelSettings.findByIdAndUpdate(
    'hotel',
    { $set: req.body },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  );
  await writeAuditLog({
    actor: req.user._id,
    action: 'hotel_settings.updated',
    resourceType: 'hotel_settings',
    resourceId: 'hotel',
  });
  return sendSuccess(res, settings, 'Hotel settings updated successfully');
});
