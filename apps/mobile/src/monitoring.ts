import * as Sentry from '@sentry/react-native';
import type { LogTransport } from '@repo/utils';

import { ENVIRONMENT, PLATFORM, RELEASE } from './app-info';
import { env } from './env';

let enabled = false;

/**
 * 6.3 — Sentry for the mobile app (its own Sentry project), tagged by app, platform and version.
 * Source maps and dSYMs are uploaded by the Sentry Expo plugin during EAS Build.
 * 5.3 — native crashes are captured by the Sentry native SDK; JS fatals go through the
 * global ErrorUtils handler below.
 * 6.5 — app start (cold/warm) and slow/frozen frames come from the tracing integration;
 * Flashlight measures them in CI (13.21).
 */
export function initMonitoring() {
  if (env.EXPO_PUBLIC_SENTRY_DSN) {
    Sentry.init({
      dsn: env.EXPO_PUBLIC_SENTRY_DSN,
      release: RELEASE,
      environment: ENVIRONMENT,
      initialScope: { tags: { app: 'mobile', platform: PLATFORM } },
      tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1,
      enableAutoPerformanceTracing: true,
      integrations: [Sentry.reactNativeTracingIntegration()],
    });
    enabled = true;
    return;
  }
  const previous = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    console.error(`[${isFatal ? 'fatal' : 'error'}]`, error);
    previous(error, isFatal);
  });
}

export function captureException(error: unknown, context?: Record<string, unknown>) {
  if (enabled) Sentry.captureException(error, { extra: context });
  else console.error(error, context);
}

/** Forwards warn/error logs (already PII-scrubbed by the logger, 6.2) as Sentry breadcrumbs. */
export const sentryTransport: LogTransport = (record) => {
  if (!enabled || (record.level !== 'warn' && record.level !== 'error')) return;
  Sentry.addBreadcrumb({
    level: record.level === 'warn' ? 'warning' : 'error',
    message: record.message,
    data: record.context,
  });
};

export const wrapRoot = Sentry.wrap;
