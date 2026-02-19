import { z } from 'zod';

export const timelineItemSchema = z.object({
  id: z.string().uuid(),
  kind: z.enum(['event', 'bill', 'habit_block', 'journal', 'insight', 'system']),
  startAt: z.string().datetime().nullable(),
  endAt: z.string().datetime().nullable(),
  title: z.string(),
  summary: z.string().nullable(),
  status: z.string(),
  metadata: z.record(z.unknown()).default({}),
});

export const timelineResponseSchema = z.object({
  date: z.string(),
  items: z.array(timelineItemSchema),
  highlights: z.object({
    focusState: z.number(),
    netLiquid: z.number(),
    bioSync: z.string(),
  }),
});

export const createTimelineItemSchema = z.object({
  kind: z.enum(['event', 'bill', 'habit_block', 'journal', 'insight', 'system']),
  startAt: z.string().datetime().optional().nullable(),
  endAt: z.string().datetime().optional().nullable(),
  title: z.string().min(1),
  summary: z.string().optional().nullable(),
  status: z.string().optional().default('scheduled'),
  metadata: z.record(z.unknown()).optional().default({}),
});

export const updateTimelineItemSchema = createTimelineItemSchema.partial();

export type TimelineItemDto = z.infer<typeof timelineItemSchema>;
export type TimelineResponseDto = z.infer<typeof timelineResponseSchema>;
export type CreateTimelineItemDto = z.infer<typeof createTimelineItemSchema>;
export type UpdateTimelineItemDto = z.infer<typeof updateTimelineItemSchema>;
