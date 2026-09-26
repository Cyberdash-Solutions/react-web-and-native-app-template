import { basePublicEnvSchema, createEnv } from '@repo/core/config';
import { z } from 'zod';

/**
 * 1.12 / 4.5 — The web app's own env schema instance. Expo only inlines `process.env.EXPO_PUBLIC_*`
 * when referenced literally, so each variable is listed explicitly.
 */
const schema = basePublicEnvSchema.extend({
  EXPO_PUBLIC_SITE_URL: z.url().default('http://localhost:8081'),
});

export const env = createEnv(schema, {
  EXPO_PUBLIC_APP_ENV: process.env.EXPO_PUBLIC_APP_ENV,
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
  EXPO_PUBLIC_SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
  EXPO_PUBLIC_ANALYTICS_WRITE_KEY: process.env.EXPO_PUBLIC_ANALYTICS_WRITE_KEY,
  EXPO_PUBLIC_SITE_URL: process.env.EXPO_PUBLIC_SITE_URL,
});
