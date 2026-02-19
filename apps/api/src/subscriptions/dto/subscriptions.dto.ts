import { z } from 'zod';

export const createSubscriptionSchema = z.object({
  title: z.string().min(1),
  vendor: z.string().min(1),
  amount: z.number().optional().nullable(),
  currency: z.string().optional().default('TRY'),
  billingCycle: z.enum(['monthly', 'yearly', 'weekly']),
  nextBillDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  autopay: z.boolean().optional().default(false),
  summary: z.string().optional().nullable(),
});

export const updateSubscriptionSchema = z.object({
  title: z.string().min(1).optional(),
  vendor: z.string().min(1).optional(),
  amount: z.number().optional().nullable(),
  currency: z.string().optional(),
  billingCycle: z.enum(['monthly', 'yearly', 'weekly']).optional(),
  nextBillDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  autopay: z.boolean().optional(),
  summary: z.string().optional().nullable(),
});

export type CreateSubscriptionDto = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionDto = z.infer<typeof updateSubscriptionSchema>;
