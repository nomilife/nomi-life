import { z } from 'zod';

export const createEventSchema = z.object({
  title: z.string().min(1),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  location: z.string().optional().nullable(),
  visibility: z.enum(['private', 'shared']).default('private'),
  recurrenceRrule: z.string().optional().nullable(),
  participantsEmails: z.array(z.string().email()).optional().default([]),
});

export const inviteSchema = z.object({
  email: z.string().email(),
});

export const rsvpSchema = z.object({
  status: z.enum(['accepted', 'declined']),
});

export const messageSchema = z.object({
  text: z.string().min(1).max(2000),
});

const externalAppSchema = z.object({
  appId: z.string().min(1),
  label: z.string().min(1),
  deepLink: z.string().refine((s) => s.includes('://'), { message: 'deepLink must contain ://' }),
  storeUrl: z.string(),
});

export const updateEventSchema = z.object({
  title: z.string().min(1).optional(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  location: z.string().optional().nullable(),
  visibility: z.enum(['private', 'shared']).optional(),
  appLink: z.string().min(1).optional().nullable(),
  metadata: z
    .object({
      externalApp: externalAppSchema.optional().nullable(),
    })
    .passthrough()
    .optional(),
  shortcutId: z.string().uuid().optional().nullable(),
});

export type CreateEventDto = z.infer<typeof createEventSchema>;
export type InviteDto = z.infer<typeof inviteSchema>;
export type RsvpDto = z.infer<typeof rsvpSchema>;
export type MessageDto = z.infer<typeof messageSchema>;
export type UpdateEventDto = z.infer<typeof updateEventSchema>;
