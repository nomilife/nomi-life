import { z } from 'zod';

export const createShortcutSchema = z.object({
  title: z.string().optional().nullable(),
  url: z.string().min(1).refine((s) => s.includes('://'), { message: 'URL must contain ://' }),
  kind: z.enum(['fitness', 'bank', 'ticket', 'transport', 'other']).default('other'),
  storeUrl: z.string().optional().nullable(),
});

export const updateShortcutSchema = createShortcutSchema.partial();

export type CreateShortcutDto = z.infer<typeof createShortcutSchema>;
export type UpdateShortcutDto = z.infer<typeof updateShortcutSchema>;
