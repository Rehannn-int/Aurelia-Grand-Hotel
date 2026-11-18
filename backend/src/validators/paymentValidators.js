import { z } from 'zod';

export const paymentIntentSchema = z.object({
  bookingReference: z.string().trim().min(5).max(40),
}).strict();

export const refundSchema = z.object({
  amount: z.number().positive().optional(),
}).strict();
