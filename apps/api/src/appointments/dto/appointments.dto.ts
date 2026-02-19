import { z } from 'zod';

export const createAppointmentSchema = z.object({
  title: z.string().min(1),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  location: z.string().optional().nullable(),
  withWhom: z.string().optional().nullable(),
  summary: z.string().optional().nullable(),
});

export const updateAppointmentSchema = z.object({
  title: z.string().min(1).optional(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  location: z.string().optional().nullable(),
  withWhom: z.string().optional().nullable(),
  summary: z.string().optional().nullable(),
});

export type CreateAppointmentDto = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentDto = z.infer<typeof updateAppointmentSchema>;
