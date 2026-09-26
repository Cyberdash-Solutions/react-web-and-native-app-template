import type { AnalyticsSink } from './client';

/**
 * 6.1 — Mobile sink. Swap the body for the vendor's React Native SDK
 * (e.g. @segment/analytics-react-native or @amplitude/analytics-react-native).
 */
export function createPlatformSink(writeKey: string | undefined): AnalyticsSink | null {
  if (!writeKey) return null;
  return {
    name: 'vendor-native',
    send: () => {
      // vendorClient.track(event.name, event.properties)
    },
  };
}
