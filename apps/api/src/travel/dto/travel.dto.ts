import { z } from 'zod';

export const createTravelSchema = z.object({
  title: z.string().min(1),
  origin: z.string().optional().nullable(),
  destination: z.string().min(1),
  departureAt: z.string().datetime().optional().nullable(),
  arrivalAt: z.string().datetime().optional().nullable(),
  summary: z.string().optional().nullable(),
});

export const updateTravelSchema = z.object({
  title: z.string().min(1).optional(),
  origin: z.string().optional().nullable(),
  destination: z.string().min(1).optional(),
  departureAt: z.string().datetime().optional().nullable(),
  arrivalAt: z.string().datetime().optional().nullable(),
  summary: z.string().optional().nullable(),
});

export type CreateTravelDto = z.infer<typeof createTravelSchema>;
export type UpdateTravelDto = z.infer<typeof updateTravelSchema>;
