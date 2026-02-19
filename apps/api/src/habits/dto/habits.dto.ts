import { z } from 'zod';

export const scheduleSchema = z.object({
  days: z.array(z.number().min(0).max(6)).optional(),
  time: z.string().optional(),
});

export const createHabitSchema = z.object({
  title: z.string().min(1),
  schedule: scheduleSchema.default({}),
  category: z.enum(['mind', 'work', 'health']).optional().nullable(),
});

export const updateHabitSchema = z.object({
  title: z.string().min(1).optional(),
  schedule: scheduleSchema.optional(),
  category: z.enum(['mind', 'work', 'health']).optional().nullable(),
  active: z.boolean().optional(),
  appLink: z.string().min(1).optional().nullable(),
  appShortcutId: z.string().uuid().optional().nullable(),
});

export const habitEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(['done', 'skipped', 'missed']),
  note: z.string().optional().nullable(),
});

export type CreateHabitDto = z.infer<typeof createHabitSchema>;
export type UpdateHabitDto = z.infer<typeof updateHabitSchema>;
export type HabitEntryDto = z.infer<typeof habitEntrySchema>;
