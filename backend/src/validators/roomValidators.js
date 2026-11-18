import { z } from 'zod';

const stringList = z.array(z.string().trim().min(1).max(100)).max(30).optional();

export const roomSchema = z.object({
  roomNumber: z.string().trim().min(1).max(20),
  category: z.string().regex(/^[a-f\d]{24}$/i),
  description: z.string().max(2000).optional(),
  operationalStatus: z.enum(['available', 'occupied', 'maintenance', 'out_of_service']).optional(),
  housekeepingStatus: z.enum(['clean', 'dirty', 'cleaning', 'inspected']).optional(),
  floor: z.coerce.number().int().min(-5).max(200).optional(),
  amenities: stringList,
  images: z.array(z.string().url()).max(10).optional(),
  active: z.boolean().optional(),
}).strict();

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120),
  description: z.string().max(2000).optional(),
  basePrice: z.number().finite().min(0).max(10000000),
  maxOccupancy: z.number().int().min(1).max(20),
  bedConfiguration: z.string().max(100).optional(),
  size: z.string().max(50).optional(),
  amenities: stringList,
  images: z.array(z.string().url()).max(10).optional(),
  active: z.boolean().optional(),
}).strict();

export const availabilitySchema = z.object({
  checkIn: z.string(),
  checkOut: z.string(),
  adults: z.coerce.number().int().min(1).max(20).default(1),
  children: z.coerce.number().int().min(0).max(20).default(0),
  roomCount: z.coerce.number().int().min(1).max(10).default(1),
  categoryId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  categorySlug: z.string().trim().min(1).max(120).optional(),
}).strict();

export const roomListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  category: z.string().trim().min(1).max(120).optional(),
  search: z.string().trim().max(80).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  occupancy: z.coerce.number().int().min(1).max(20).optional(),
  amenity: z.string().trim().min(1).max(100).optional(),
  sort: z.enum([
    'roomNumber', '-roomNumber', 'name', '-name',
    'basePrice', '-basePrice', 'createdAt', '-createdAt',
  ]).default('name'),
}).strict().refine((value) => value.minPrice === undefined || value.maxPrice === undefined || value.minPrice <= value.maxPrice, {
  message: 'Minimum price cannot exceed maximum price',
  path: ['maxPrice'],
});
