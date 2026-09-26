/**
 * 3.3 — Web: TanStack Query already listens to `navigator.onLine` online/offline events and
 * `visibilitychange`, so there is nothing extra to wire.
 */
export function connectNetworkStatus(): () => void {
  return () => {};
}
