import { z } from 'zod';

const bookingFields = {
  checkIn: z.string(),
  checkOut: z.string(),
  adults: z.number().int().min(1).max(20),
  children: z.number().int().min(0).max(20).default(0),
  roomCount: z.number().int().min(1).max(10),
  categoryId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  categorySlug: z.string().trim().min(1).max(120).optional(),
};

export const bookingSchema = z.object({
  ...bookingFields,
  guestName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(30).optional(),
  specialRequests: z.string().trim().max(2000).optional(),
}).strict().refine((value) => Boolean(value.categoryId || value.categorySlug), {
  message: 'A room category is required',
  path: ['categorySlug'],
});

export const quoteSchema = z.object({
  ...bookingFields,
}).refine((value) => Boolean(value.categoryId || value.categorySlug), {
  message: 'A room category is required',
  path: ['categorySlug'],
});
