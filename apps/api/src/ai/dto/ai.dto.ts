import { z } from 'zod';

export const createJobSchema = z.object({
  jobType: z.string().min(1),
  input: z.record(z.unknown()).optional().default({}),
});

export const parseCommandSchema = z.object({
  text: z.string().min(1),
});

export const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
});
export const chatSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(50),
});

export type CreateJobDto = z.infer<typeof createJobSchema>;
export type ParseCommandDto = z.infer<typeof parseCommandSchema>;
export type ChatDto = z.infer<typeof chatSchema>;
