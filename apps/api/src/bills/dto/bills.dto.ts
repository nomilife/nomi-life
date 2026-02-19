import { z } from 'zod';

export const createBillSchema = z.object({
  vendor: z.string().min(1),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  recurrence: z.enum(['monthly', 'weekly', 'yearly']).optional().nullable(),
  autopay: z.boolean().default(false),
  amount: z.number().optional().nullable(),
});

export const updateBillSchema = z.object({
  vendor: z.string().min(1).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  recurrence: z.enum(['monthly', 'weekly', 'yearly']).optional().nullable(),
  autopay: z.boolean().optional(),
  amount: z.number().optional().nullable(),
  appLink: z.string().min(1).optional().nullable(),
});

export const amountSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().optional().default('TRY'),
});

export type CreateBillDto = z.infer<typeof createBillSchema>;
export type UpdateBillDto = z.infer<typeof updateBillSchema>;
export type AmountDto = z.infer<typeof amountSchema>;
