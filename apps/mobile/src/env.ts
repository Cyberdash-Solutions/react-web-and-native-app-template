import { basePublicEnvSchema, createEnv } from '@repo/config';

/**
 * 1.12 / 4.5 — The mobile app's own env schema instance. Expo only inlines
 * `process.env.EXPO_PUBLIC_*` when referenced literally, so each variable is listed explicitly.
 */
export const env = createEnv(basePublicEnvSchema, {
  EXPO_PUBLIC_APP_ENV: process.env.EXPO_PUBLIC_APP_ENV,
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
  EXPO_PUBLIC_SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
  EXPO_PUBLIC_ANALYTICS_WRITE_KEY: process.env.EXPO_PUBLIC_ANALYTICS_WRITE_KEY,
});
