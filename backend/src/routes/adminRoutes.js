import { Router } from 'express';
import { dashboard, guestDirectory, reservationReport, revenueReport } from '../controllers/adminController.js';
import * as roomController from '../controllers/roomController.js';
import * as bookingController from '../controllers/bookingController.js';
import * as paymentController from '../controllers/paymentController.js';
import * as staffController from '../controllers/staffController.js';
import * as serviceController from '../controllers/serviceController.js';
import * as settingsController from '../controllers/settingsController.js';
import { requireAuth } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { categorySchema, roomListQuerySchema, roomSchema } from '../validators/roomValidators.js';
import { refundSchema } from '../validators/paymentValidators.js';
import {
  hotelServiceSchema,
  hotelSettingsSchema,
  staffCreateSchema,
  staffUpdateSchema,
} from '../validators/staffValidators.js';
import {
  adminBookingQuerySchema,
  guestQuerySchema,
  paymentQuerySchema,
  reportQuerySchema,
  revenueQuerySchema,
  staffQuerySchema,
} from '../validators/adminValidators.js';
import { z } from 'zod';

const router = Router();
const managers = [requireAuth, requireRole('super_admin', 'hotel_manager')];
const bookingManagers = [requireAuth, requireRole('super_admin', 'hotel_manager', 'receptionist')];
router.get('/dashboard', ...bookingManagers, dashboard);
router.get('/rooms', ...managers, validate(roomListQuerySchema, 'query'), roomController.listAdminRooms);
router.get('/room-categories', ...managers, roomController.listAdminCategories);
router.post('/rooms', ...managers, validate(roomSchema), roomController.createRoom);
router.patch('/rooms/:id', ...managers, validate(roomSchema.partial().refine((value) => Object.keys(value).length > 0)), roomController.updateRoom);
router.delete('/rooms/:id', ...managers, roomController.deactivateRoom);
router.post('/room-categories', ...managers, validate(categorySchema), roomController.createCategory);
router.patch('/room-categories/:id', ...managers, validate(categorySchema.partial().refine((value) => Object.keys(value).length > 0)), roomController.updateCategory);
router.delete('/room-categories/:id', ...managers, roomController.deactivateCategory);
router.get('/bookings', ...bookingManagers, validate(adminBookingQuerySchema, 'query'), bookingController.listAdminBookings);
router.patch('/bookings/:id/status', ...bookingManagers, validate(z.object({
  status: z.enum(['confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show']),
}).strict()), bookingController.updateAdminStatus);
router.get('/guests', ...bookingManagers, validate(guestQuerySchema, 'query'), guestDirectory);
router.get('/reports/reservations', ...managers, validate(reportQuerySchema, 'query'), reservationReport);
router.get('/reports/revenue', ...managers, validate(revenueQuerySchema, 'query'), revenueReport);
router.get('/payments', ...managers, validate(paymentQuerySchema, 'query'), paymentController.adminPayments);
router.post('/payments/:id/refund', ...managers, validate(refundSchema), paymentController.refund);
router.get('/staff', ...managers, validate(staffQuerySchema, 'query'), staffController.listStaff);
router.post('/staff', requireAuth, requireRole('super_admin'), validate(staffCreateSchema), staffController.createStaff);
router.patch('/staff/:id', requireAuth, requireRole('super_admin'), validate(staffUpdateSchema), staffController.updateStaff);
router.get('/services', ...managers, serviceController.listServices);
router.post('/services', ...managers, validate(hotelServiceSchema), serviceController.createService);
router.patch('/services/:id', ...managers, validate(hotelServiceSchema.partial().refine((value) => Object.keys(value).length > 0)), serviceController.updateService);
router.delete('/services/:id', ...managers, serviceController.deactivateService);
router.get('/settings', ...managers, settingsController.getHotelSettings);
router.put('/settings', requireAuth, requireRole('super_admin'), validate(hotelSettingsSchema), settingsController.updateHotelSettings);
export default router;
