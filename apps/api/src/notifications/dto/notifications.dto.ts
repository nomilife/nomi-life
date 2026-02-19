import { z } from 'zod';

export const registerTokenSchema = z.object({
  expoPushToken: z.string().min(1),
});

export type RegisterTokenDto = z.infer<typeof registerTokenSchema>;
