import type { AnalyticsSink } from './client';

/**
 * 6.1 — Web sink. Swap the body for the vendor's browser SDK
 * (e.g. @segment/analytics-next or @amplitude/analytics-browser).
 */
export function createPlatformSink(writeKey: string | undefined): AnalyticsSink | null {
  if (!writeKey) return null;
  return {
    name: 'vendor-web',
    send: () => {
      // analytics.track(event.name, event.properties)
    },
  };
}
