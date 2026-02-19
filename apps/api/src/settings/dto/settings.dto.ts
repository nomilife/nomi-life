import { z } from 'zod';

const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;

const usernameRegex = /^[a-z0-9_]{3,30}$/;

export const updateSettingsSchema = z.object({
  locale: z.enum(['en', 'tr']).optional(),
  timezone: z.string().min(1).optional(),
  quiet_hours_start: z.string().regex(timeRegex).nullable().optional(),
  quiet_hours_end: z.string().regex(timeRegex).nullable().optional(),
  username: z
    .string()
    .min(3, 'En az 3 karakter')
    .max(30, 'En fazla 30 karakter')
    .transform((s) => s.trim().toLowerCase())
    .refine((s) => /^[a-z0-9_]{3,30}$/.test(s), 'Sadece harf, rakam ve alt çizgi (a-z, 0-9, _)')
    .optional(),
});

export const updateNotificationRuleSchema = z.object({
  enabled: z.boolean(),
});

export type UpdateSettingsDto = z.infer<typeof updateSettingsSchema>;
export type UpdateNotificationRuleDto = z.infer<typeof updateNotificationRuleSchema>;
