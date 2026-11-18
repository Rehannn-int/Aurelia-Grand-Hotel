import { Router } from 'express';
import * as roomController from '../controllers/roomController.js';
import { requireAuth } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { availabilitySchema, categorySchema, roomListQuerySchema, roomSchema } from '../validators/roomValidators.js';

const router = Router();
const managers = [requireAuth, requireRole('super_admin', 'hotel_manager')];

router.get('/categories', roomController.listCategories);
router.get('/availability', validate(availabilitySchema, 'query'), roomController.availability);
router.get('/', validate(roomListQuerySchema, 'query'), roomController.listRooms);
router.get('/admin/list', ...managers, validate(roomListQuerySchema, 'query'), roomController.listAdminRooms);
router.post('/admin', ...managers, validate(roomSchema), roomController.createRoom);
router.patch('/admin/:id', ...managers, validate(roomSchema.partial().refine((value) => Object.keys(value).length > 0)), roomController.updateRoom);
router.delete('/admin/:id', ...managers, roomController.deactivateRoom);
router.post('/admin/categories', ...managers, validate(categorySchema), roomController.createCategory);
router.patch('/admin/categories/:id', ...managers, validate(categorySchema.partial().refine((value) => Object.keys(value).length > 0)), roomController.updateCategory);
router.delete('/admin/categories/:id', ...managers, roomController.deactivateCategory);

export default router;
