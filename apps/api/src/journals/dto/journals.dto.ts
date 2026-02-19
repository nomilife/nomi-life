import { z } from 'zod';

export const createJournalSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  mood: z.string().optional().nullable(),
  createdAt: z.string().datetime().optional(),
});

export const updateJournalSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  mood: z.string().optional().nullable(),
});

export type CreateJournalDto = z.infer<typeof createJournalSchema>;
export type UpdateJournalDto = z.infer<typeof updateJournalSchema>;
