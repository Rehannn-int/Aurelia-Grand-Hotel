import { Router } from 'express';
import * as paymentController from '../controllers/paymentController.js';
import { requireAuth } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { paymentIntentSchema, refundSchema } from '../validators/paymentValidators.js';
import ApiError from '../utils/ApiError.js';

const router = Router();
const idempotencyHeader = (req, res, next) => {
  const value = req.get('idempotency-key');
  if (!value || value.length < 8 || value.length > 128 || !/^[A-Za-z0-9._:-]+$/.test(value)) {
    return next(new ApiError(400, 'A valid Idempotency-Key header is required'));
  }
  req.body.idempotencyKey = value;
  return next();
};

router.post('/intents', requireAuth, validate(paymentIntentSchema), idempotencyHeader, paymentController.createIntent);
router.get('/my', requireAuth, paymentController.myPayments);
router.get('/admin/list', requireAuth, requireRole('super_admin', 'hotel_manager'), paymentController.adminPayments);
router.post('/admin/:id/refund', requireAuth, requireRole('super_admin', 'hotel_manager'), validate(refundSchema), paymentController.refund);
router.post('/webhook', (req, res, next) => next(new ApiError(400, 'Webhook endpoint requires a raw signed request body')));

export default router;
