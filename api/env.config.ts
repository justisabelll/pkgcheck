import { z } from 'zod';
import { Context } from 'hono';
import { env } from 'hono/adapter';

const envSchema = z.object({
  OPENAI_API_KEY: z.string(),
  GOOGLE_API_KEY: z.string(),
});

export type Env = z.infer<typeof envSchema>;

// Create a global env store
export class EnvStore {
  private static env: Env | null = null;

  static set(c: Context) {
    const bindings = env<Env>(c);
    this.env = envSchema.parse(bindings);
  }

  static get(): Env {
    if (!this.env) {
      throw new Error(
        'Environment not initialized. Call EnvStore.set() first.'
      );
    }
    return this.env;
  }
}

export const getEnv = (c: Context) => {
  EnvStore.set(c);
  return EnvStore.get();
};
