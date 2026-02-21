import { z } from 'zod';

const lifeAreasSchema = z.object({
  social: z.boolean().optional(),
  health: z.boolean().optional(),
  finance: z.boolean().optional(),
  mind: z.boolean().optional(),
  relationships: z.boolean().optional(),
  admin: z.boolean().optional(),
  work: z.boolean().optional(),
});

const dailyRhythmSchema = z.object({
  wakeTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  sleepTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  workStart: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  workEnd: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
});

const aiPreferencesSchema = z.object({
  autoCategorize: z.boolean().optional(),
  suggestPlans: z.boolean().optional(),
  weeklyInsights: z.boolean().optional(),
  useDataPreferences: z.boolean().optional(),
  tone: z.enum(['calm', 'neutral', 'strict']).optional(),
  responseLength: z.enum(['short', 'balanced', 'detailed']).optional(),
  emojiLevel: z.number().min(0).max(2).optional(),
  checkinPreference: z.enum(['morning', 'evening', 'adaptive']).optional(),
});

const billTemplateSchema = z.object({
  vendor: z.string().min(1),
  dueDay: z.number().min(1).max(31),
  autopay: z.boolean().default(true),
});

const financeSetupSchema = z.object({
  billTemplates: z.array(billTemplateSchema).optional().default([]),
});

export const saveStepSchema = z.object({
  step: z.number().min(1).max(6),
  payload: z.record(z.unknown()),
});

export { lifeAreasSchema, dailyRhythmSchema, aiPreferencesSchema, financeSetupSchema };

export const completeSchema = z.object({
  triggerWow: z.boolean().optional().default(false),
});

export type SaveStepDto = z.infer<typeof saveStepSchema>;
export type CompleteDto = z.infer<typeof completeSchema>;
