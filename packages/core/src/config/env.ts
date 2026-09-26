import { z } from 'zod';

/**
 * 4.5 — Env vars are validated by a schema. Each app builds its own instance (1.12) from
 * these building blocks. Only variables with the app's public prefix are ever inlined
 * into a client bundle; everything else is build-time / server-only.
 */
export const PUBLIC_ENV_PREFIX = 'EXPO_PUBLIC_' as const;

export const appEnvironment = z.enum(['development', 'test', 'staging', 'production']);
export type AppEnvironment = z.infer<typeof appEnvironment>;

/** Fields every app's public env shares. Apps `.extend()` this with their own keys. */
export const basePublicEnvSchema = z.object({
  EXPO_PUBLIC_APP_ENV: appEnvironment.default('development'),
  EXPO_PUBLIC_API_URL: z.url().default('http://localhost:4000'),
  EXPO_PUBLIC_SENTRY_DSN: z.string().optional(),
  EXPO_PUBLIC_ANALYTICS_WRITE_KEY: z.string().optional(),
});

export class EnvValidationError extends Error {
  constructor(public readonly issues: z.core.$ZodIssue[]) {
    super(
      `Invalid environment variables:\n${issues
        .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
        .join('\n')}`,
    );
    this.name = 'EnvValidationError';
  }
}

/**
 * Validates `source` against `schema`. Rejects any key in the schema that does not carry
 * the public prefix, so secrets can never be declared as client-visible by accident.
 */
export function createEnv<S extends z.ZodObject>(
  schema: S,
  source: Record<string, string | undefined>,
): z.infer<S> {
  const nonPublic = Object.keys(schema.shape).filter((k) => !k.startsWith(PUBLIC_ENV_PREFIX));
  if (nonPublic.length > 0) {
    throw new Error(
      `Client env schema contains non-public keys (${nonPublic.join(', ')}). Only ${PUBLIC_ENV_PREFIX}* may reach the client bundle.`,
    );
  }
  const parsed = schema.safeParse(source);
  if (!parsed.success) throw new EnvValidationError(parsed.error.issues);
  return parsed.data;
}
