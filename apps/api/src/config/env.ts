import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY is required').default('mock-key'),
  ELEVENLABS_API_KEY: z.string().min(1, 'ELEVENLABS_API_KEY is required').default('mock-key'),
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
  ALLOWED_ORIGINS: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let env: Env;

export function validateEnv(): Env {
  if (env) return env;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables configuration:');
    result.error.issues.forEach((err) => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
    process.exit(1);
  }

  env = result.data;

  // In production, enforce that we don't use default/mock keys
  if (env.NODE_ENV === 'production') {
    if (env.ANTHROPIC_API_KEY === 'mock-key' || !process.env.ANTHROPIC_API_KEY) {
      console.error('❌ Error: ANTHROPIC_API_KEY is required in production.');
      process.exit(1);
    }
    if (env.ELEVENLABS_API_KEY === 'mock-key' || !process.env.ELEVENLABS_API_KEY) {
      console.error('❌ Error: ELEVENLABS_API_KEY is required in production.');
      process.exit(1);
    }
  }

  return env;
}

export function getEnv(): Env {
  if (!env) {
    return validateEnv();
  }
  return env;
}
