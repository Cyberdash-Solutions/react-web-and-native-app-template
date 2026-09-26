import * as Sentry from '@sentry/react';
import type { LogTransport } from '@repo/utils';
import { onCLS, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';

import { ENVIRONMENT, PLATFORM, RELEASE } from './app-info';
import { env } from './env';

let enabled = false;

/**
 * 6.3 — Sentry for the web app (its own Sentry project), tagged by app, platform and version.
 * Source maps are uploaded in CI (see .github/workflows/web.yml).
 * 5.3 — global window.onerror and unhandled rejections are captured by Sentry's default
 * integrations; without a DSN they are logged instead.
 */
export function initMonitoring(onMetric?: (metric: Metric) => void) {
  if (typeof window === 'undefined') return;
  if (env.EXPO_PUBLIC_SENTRY_DSN) {
    Sentry.init({
      dsn: env.EXPO_PUBLIC_SENTRY_DSN,
      release: RELEASE,
      environment: ENVIRONMENT,
      initialScope: { tags: { app: 'web', platform: PLATFORM } },
      tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1,
    });
    enabled = true;
  } else {
    window.addEventListener('error', (e) =>
      console.error('[window.onerror]', e.error ?? e.message),
    );
    window.addEventListener('unhandledrejection', (e) =>
      console.error('[unhandledrejection]', e.reason),
    );
  }

  // 6.5 — Core Web Vitals.
  const report = (metric: Metric) => {
    onMetric?.(metric);
    if (enabled)
      Sentry.setMeasurement(metric.name, metric.value, metric.name === 'CLS' ? '' : 'millisecond');
  };
  onCLS(report);
  onINP(report);
  onLCP(report);
  onTTFB(report);
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
