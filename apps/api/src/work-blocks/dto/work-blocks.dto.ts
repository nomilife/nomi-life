import { z } from 'zod';

export const createWorkBlockSchema = z.object({
  title: z.string().min(1),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  project: z.string().optional().nullable(),
  summary: z.string().optional().nullable(),
});

export const updateWorkBlockSchema = z.object({
  title: z.string().min(1).optional(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  project: z.string().optional().nullable(),
  summary: z.string().optional().nullable(),
});

export type CreateWorkBlockDto = z.infer<typeof createWorkBlockSchema>;
export type UpdateWorkBlockDto = z.infer<typeof updateWorkBlockSchema>;
