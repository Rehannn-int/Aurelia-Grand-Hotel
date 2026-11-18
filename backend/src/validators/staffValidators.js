import { z } from 'zod';

export const staffCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  password: z.string().min(12).max(128),
  phone: z.string().trim().max(30).optional(),
  role: z.enum(['hotel_manager', 'receptionist']),
}).strict();

export const staffUpdateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  phone: z.string().trim().max(30).optional(),
  role: z.enum(['hotel_manager', 'receptionist']).optional(),
  isActive: z.boolean().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, {
  message: 'At least one staff field must be provided',
});

export const hotelServiceSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000).optional(),
  category: z.enum(['dining', 'wellness', 'transport', 'concierge', 'other']),
  price: z.number().finite().min(0).max(10000000),
  currency: z.string().regex(/^[A-Z]{3}$/).default('INR'),
  active: z.boolean().optional(),
}).strict();

export const hotelSettingsSchema = z.object({
  hotelName: z.string().trim().min(2).max(120),
  contactEmail: z.union([z.string().trim().email().max(254), z.literal('')]).optional(),
  contactPhone: z.string().trim().max(30).optional(),
  timezone: z.string().trim().min(1).max(100),
  currency: z.string().regex(/^[A-Z]{3}$/),
}).strict();
