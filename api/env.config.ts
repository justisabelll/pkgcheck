import { z } from 'zod';

export const envSchema = z.object({
  OPENAI_API_KEY: z.string(),
  GOOGLE_API_KEY: z.string(),
  API_TOKEN: z.string(),
});

export type Env = z.infer<typeof envSchema>;
