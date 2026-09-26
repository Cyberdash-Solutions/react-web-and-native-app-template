import { useConsent } from '@repo/core/analytics';
import { registerServiceWorker } from '../src/pwa';
import { Slot } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { ENVIRONMENT } from '../src/app-info';
import { ConsentBanner } from '../src/components/ConsentBanner';
import { Header } from '../src/components/Header';
import { UpgradeGate } from '../src/components/UpgradeGate';
import { initMonitoring } from '../src/monitoring';
import { AppProviders } from '../src/providers';
import { createServices } from '../src/services';

// Expo Router's route-level error boundary uses the shared ui fallback (5.2).
export { ErrorBoundary } from 'expo-router';

function AppStarted({ services }: { services: ReturnType<typeof createServices> }) {
  const { granted } = useConsent();
  useEffect(() => {
    if (granted) services.analytics.track('app_opened', { coldStart: true });
  }, [granted, services.analytics]);
  return null;
}

export default function RootLayout() {
  const [services] = useState(createServices);

  useEffect(() => {
    initMonitoring((metric) =>
      services.logger.debug('web-vital', { name: metric.name, value: metric.value }),
    );
    // 11.2 — offline shell + web push. Skipped in development to keep hot reload predictable.
    if (ENVIRONMENT !== 'development') void registerServiceWorker();
  }, [services]);

  return (
    <AppProviders services={services}>
      <AppStarted services={services} />
      <View style={{ flex: 1, minHeight: '100%' as unknown as number }}>
        <Header />
        <UpgradeGate>
          <Slot />
        </UpgradeGate>
        <ConsentBanner />
      </View>
    </AppProviders>
  );
}
