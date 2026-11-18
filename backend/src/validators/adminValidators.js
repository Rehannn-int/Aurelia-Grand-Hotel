import { z } from 'zod';

const paginationFields = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
};

export const adminBookingQuerySchema = z.object({
  ...paginationFields,
  status: z.enum(['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show']).optional(),
  search: z.string().trim().max(80).optional(),
  startDate: z.string().refine(isValidDate, 'Date must use YYYY-MM-DD').optional(),
  endDate: z.string().refine(isValidDate, 'Date must use YYYY-MM-DD').optional(),
  sort: z.enum(['createdAt', '-createdAt', 'checkIn', '-checkIn']).default('-createdAt'),
}).strict().refine((value) => {
  if (!value.startDate || !value.endDate) return true;
  return value.startDate <= value.endDate
    && (new Date(`${value.endDate}T00:00:00.000Z`) - new Date(`${value.startDate}T00:00:00.000Z`)) <= 366 * 86400000;
}, {
  message: 'Date range must be ordered and no longer than 366 days',
  path: ['endDate'],
});

export const guestQuerySchema = z.object({
  ...paginationFields,
  search: z.string().trim().max(80).optional(),
}).strict();

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export const reportQuerySchema = z.object({
  ...paginationFields,
  startDate: z.string().refine(isValidDate, 'Date must use YYYY-MM-DD').optional(),
  endDate: z.string().refine(isValidDate, 'Date must use YYYY-MM-DD').optional(),
  status: z.enum(['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show']).optional(),
}).strict().refine((value) => {
  if (!value.startDate || !value.endDate) return true;
  return value.startDate <= value.endDate
    && (new Date(`${value.endDate}T00:00:00.000Z`) - new Date(`${value.startDate}T00:00:00.000Z`)) <= 366 * 86400000;
}, {
  message: 'Date range must be ordered and no longer than 366 days',
  path: ['endDate'],
});

export const revenueQuerySchema = z.object({
  ...paginationFields,
  startDate: z.string().refine(isValidDate, 'Date must use YYYY-MM-DD').optional(),
  endDate: z.string().refine(isValidDate, 'Date must use YYYY-MM-DD').optional(),
  status: z.enum(['pending', 'succeeded', 'failed', 'refunded', 'partially_refunded']).optional(),
}).strict().refine((value) => {
  if (!value.startDate || !value.endDate) return true;
  return value.startDate <= value.endDate
    && (new Date(`${value.endDate}T00:00:00.000Z`) - new Date(`${value.startDate}T00:00:00.000Z`)) <= 366 * 86400000;
}, {
  message: 'Date range must be ordered and no longer than 366 days',
  path: ['endDate'],
});

export const paymentQuerySchema = z.object({
  ...paginationFields,
  status: z.enum(['pending', 'succeeded', 'failed', 'refunded', 'partially_refunded']).optional(),
}).strict();

export const staffQuerySchema = z.object({
  ...paginationFields,
  search: z.string().trim().max(80).optional(),
  role: z.enum(['hotel_manager', 'receptionist', 'housekeeping_staff']).optional(),
  active: z.enum(['true', 'false']).optional(),
}).strict();
