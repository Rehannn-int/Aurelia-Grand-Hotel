import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as bookingController from '../controllers/bookingController.js';
import { requireAuth } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { requireIdempotencyKey } from '../middleware/idempotencyKey.js';
import { bookingSchema, quoteSchema } from '../validators/bookingValidators.js';
import { z } from 'zod';

const router = Router();
const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many booking requests. Try again later.', errors: [] },
});

router.post('/quote', validate(quoteSchema), bookingController.quote);
router.post('/', requireAuth, bookingLimiter, requireIdempotencyKey, validate(bookingSchema), bookingController.create);
router.get('/my', requireAuth, bookingController.myBookings);
router.post('/:id/cancel', requireAuth, bookingController.cancelMine);
router.get('/admin/list', requireAuth, requireRole('super_admin', 'hotel_manager', 'receptionist'), bookingController.listAdminBookings);
router.patch('/admin/:id/status', requireAuth, requireRole('super_admin', 'hotel_manager', 'receptionist'), validate(z.object({
  status: z.enum(['confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show']),
}).strict()), bookingController.updateAdminStatus);

export default router;
