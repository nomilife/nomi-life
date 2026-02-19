import { z } from 'zod';

export const createGoalSchema = z.object({
  title: z.string().min(1),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  lifeArea: z.string().optional().nullable(),
  progress: z.number().min(0).max(100).optional().default(0),
  summary: z.string().optional().nullable(),
});

export const updateGoalSchema = z.object({
  title: z.string().min(1).optional(),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  lifeArea: z.string().optional().nullable(),
  progress: z.number().min(0).max(100).optional(),
  summary: z.string().optional().nullable(),
});

export type CreateGoalDto = z.infer<typeof createGoalSchema>;
export type UpdateGoalDto = z.infer<typeof updateGoalSchema>;
