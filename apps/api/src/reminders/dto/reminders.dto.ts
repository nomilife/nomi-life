import { z } from 'zod';

export const createReminderSchema = z.object({
  title: z.string().min(1),
  remindAt: z.string().datetime(),
  recurrence: z.enum(['once', 'daily', 'weekly', 'monthly']).optional().default('once'),
  summary: z.string().optional().nullable(),
});

export const updateReminderSchema = z.object({
  title: z.string().min(1).optional(),
  remindAt: z.string().datetime().optional(),
  recurrence: z.enum(['once', 'daily', 'weekly', 'monthly']).optional(),
  summary: z.string().optional().nullable(),
});

export type CreateReminderDto = z.infer<typeof createReminderSchema>;
export type UpdateReminderDto = z.infer<typeof updateReminderSchema>;
