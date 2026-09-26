import type { LogTransport } from '@repo/utils';
import type * as SentryModule from '@sentry/react';
import { onCLS, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';

import { ENVIRONMENT, PLATFORM, RELEASE } from './app-info';
import { env } from './env';

/** Set once the Sentry SDK has loaded and initialized. */
let sentry: typeof SentryModule | null = null;

/**
 * 6.3 — Sentry for the web app (its own Sentry project), tagged by app, platform and version.
 * Source maps are uploaded in CI (see .github/workflows/web.yml).
 * 5.3 — global window.onerror and unhandled rejections are captured by Sentry's default
 * integrations; without a DSN (or until the SDK loads) they are logged instead.
 * 7.4 — the SDK is loaded with a dynamic import, in its own chunk, and only when a DSN is set,
 * so it never adds to the main bundle's parse and blocking time.
 */
export function initMonitoring(onMetric?: (metric: Metric) => void) {
  if (typeof window === 'undefined') return;
  window.addEventListener('error', (e) => {
    if (!sentry) console.error('[window.onerror]', e.error ?? e.message);
  });
  window.addEventListener('unhandledrejection', (e) => {
    if (!sentry) console.error('[unhandledrejection]', e.reason);
  });

  const dsn = env.EXPO_PUBLIC_SENTRY_DSN;
  if (dsn) {
    import('@sentry/react')
      .then((Sentry) => {
        Sentry.init({
          dsn,
          release: RELEASE,
          environment: ENVIRONMENT,
          initialScope: { tags: { app: 'web', platform: PLATFORM } },
          tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 1,
        });
        sentry = Sentry;
      })
      .catch((error: unknown) => console.warn('Sentry failed to load', error));
  }

  // 6.5 — Core Web Vitals.
  const report = (metric: Metric) => {
    onMetric?.(metric);
    sentry?.setMeasurement(metric.name, metric.value, metric.name === 'CLS' ? '' : 'millisecond');
  };
  onCLS(report);
  onINP(report);
  onLCP(report);
  onTTFB(report);
}

export function captureException(error: unknown, context?: Record<string, unknown>) {
  if (sentry) sentry.captureException(error, { extra: context });
  else console.error(error, context);
}

/** Forwards warn/error logs (already PII-scrubbed by the logger, 6.2) as Sentry breadcrumbs. */
export const sentryTransport: LogTransport = (record) => {
  if (!sentry || (record.level !== 'warn' && record.level !== 'error')) return;
  sentry.addBreadcrumb({
    level: record.level === 'warn' ? 'warning' : 'error',
    message: record.message,
    data: record.context,
  });
};
