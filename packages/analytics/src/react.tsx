import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useStore } from 'zustand';

import type { Analytics } from './client';
import type { ConsentStore } from './consent';

const AnalyticsContext = createContext<{ analytics: Analytics; consent: ConsentStore } | null>(
  null,
);

export function AnalyticsProvider({
  analytics,
  consent,
  children,
}: {
  analytics: Analytics;
  consent: ConsentStore;
  children: ReactNode;
}) {
  return (
    <AnalyticsContext.Provider value={{ analytics, consent }}>{children}</AnalyticsContext.Provider>
  );
}

function useAnalyticsContext() {
  const ctx = useContext(AnalyticsContext);
  if (!ctx) throw new Error('Analytics hooks must be used inside <AnalyticsProvider>');
  return ctx;
}

export const useAnalytics = () => useAnalyticsContext().analytics;

export function useConsent() {
  const { consent, analytics } = useAnalyticsContext();
  const granted = useStore(consent, (s) => s.analytics);
  const setGranted = (value: boolean) => {
    consent.getState().setAnalyticsConsent(value);
    analytics.track('consent_updated', { analytics: value });
  };
  return { granted, decided: granted !== null, setGranted };
}

export function useTrackScreen(screen: string) {
  const analytics = useAnalytics();
  useEffect(() => analytics.track('screen_viewed', { screen }), [analytics, screen]);
}
