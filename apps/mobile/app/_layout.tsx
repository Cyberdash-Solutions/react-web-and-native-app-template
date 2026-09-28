import { useAuth } from '@repo/core/auth';
import { useTranslation } from '@repo/core/i18n';
import { registerForPushNotifications, useNotificationRouting } from '../src/push';
import { useTheme } from '@repo/ui';
import { Stack, useRouter, type Href } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { EAS_PROJECT_ID } from '../src/app-info';
import { registerBackgroundSync } from '../src/background';
import { BiometricGate } from '../src/components/BiometricGate';
import { UpgradeGate } from '../src/components/UpgradeGate';
import { captureException, initMonitoring, wrapRoot } from '../src/monitoring';
import { AppProviders } from '../src/providers';
import { initSecurity } from '../src/security';
import { createServices, type Services } from '../src/services';
import { useOtaUpdates } from '../src/updates';

export { ErrorBoundary } from 'expo-router';

initMonitoring();
void initSecurity();
void SplashScreen.preventAutoHideAsync();

/** Hides the splash screen once the stored session has been restored (or ruled out). */
function Bootstrap({ services }: { services: Services }) {
  const auth = useAuth();
  const router = useRouter();
  const navigate = useCallback((path: string) => router.push(path as Href), [router]);
  useNotificationRouting(navigate);
  useOtaUpdates(captureException);

  useEffect(() => {
    if (auth.status !== 'unknown') void SplashScreen.hideAsync();
    if (auth.status === 'signedIn') {
      // 11.1 — register the device for push once we know who it belongs to.
      registerForPushNotifications(EAS_PROJECT_ID).then(
        (token) => token && services.logger.info('push token registered'),
        (error) => services.logger.warn('push registration failed', { error }),
      );
    }
  }, [auth.status, services.logger]);

  useEffect(() => {
    if (services.consent.getState().analytics)
      services.analytics.track('app_opened', { coldStart: true });
    registerBackgroundSync(services).catch((error) =>
      services.logger.warn('background sync unavailable', { error }),
    );
  }, [services]);
  return null;
}

function Navigator() {
  const { t } = useTranslation();
  const { colors, scheme } = useTheme();
  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.text },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ title: t('appName') }} />
        <Stack.Screen name="sign-in" options={{ title: t('signIn'), presentation: 'modal' }} />
        <Stack.Screen name="sign-up" options={{ title: t('signUp'), presentation: 'modal' }} />
        <Stack.Screen name="settings" options={{ title: t('settings') }} />
        <Stack.Screen name="profile" options={{ title: t('profile') }} />
        <Stack.Screen name="privacy" options={{ title: t('privacy') }} />
        <Stack.Screen name="messages/[id]" options={{ title: '' }} />
      </Stack>
    </>
  );
}

function RootLayout() {
  const [services] = useState(createServices);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProviders services={services}>
        <Bootstrap services={services} />
        <UpgradeGate>
          <BiometricGate>
            <Navigator />
          </BiometricGate>
        </UpgradeGate>
      </AppProviders>
    </GestureHandlerRootView>
  );
}

export default wrapRoot(RootLayout);
