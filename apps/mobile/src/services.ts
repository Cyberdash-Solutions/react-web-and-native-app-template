import {
  createAnalytics,
  createConsentStore,
  createConsoleSink,
  createPlatformSink,
} from '@repo/analytics';
import { createApiClient, createEndpoints } from '@repo/api-client';
import { createAuthSession, createPlatformTokenStorage, type AuthSession } from '@repo/auth';
import { createStaticFlagClient } from '@repo/config';
import { createQueryClient } from '@repo/data';
import { createI18n, detectLocale } from '@repo/i18n';
import { createDefaultStorage, createPreferencesStore } from '@repo/state';
import { consoleTransport, createLogger, isDefined } from '@repo/utils';

import { APP_NAME, APP_VERSION, ENVIRONMENT, PLATFORM } from './app-info';
import { env } from './env';
import { sentryTransport } from './monitoring';

/**
 * The mobile app's composition root: shared packages wired with native adapters.
 *   - auth: refresh token in Keychain / Keystore via expo-secure-store (4.2)
 *   - state: MMKV (2.3)
 *   - analytics: native SDK sink, gated on consent (6.1, 14.1)
 */
export function createServices() {
  const logger = createLogger({
    transports: [consoleTransport, sentryTransport],
    minLevel: ENVIRONMENT === 'production' ? 'info' : 'debug',
    context: { app: APP_NAME, platform: PLATFORM, version: APP_VERSION },
  });

  const kv = createDefaultStorage('hello-world');
  const preferences = createPreferencesStore(kv);
  const consent = createConsentStore(kv);

  // eslint-disable-next-line prefer-const
  let session: AuthSession;
  const client = createApiClient({
    baseUrl: env.EXPO_PUBLIC_API_URL,
    defaultHeaders: { 'X-Client-Platform': PLATFORM, 'X-Client-Version': APP_VERSION },
    getAccessToken: () => session.getAccessToken(),
    refreshAuth: () => session.refresh(),
  });
  const endpoints = createEndpoints(client);
  session = createAuthSession({
    storage: createPlatformTokenStorage(),
    api: () => endpoints,
    onError: (error) => logger.warn('auth refresh failed', { code: error.code }),
  });

  const analytics = createAnalytics({
    sinks: [
      createPlatformSink(env.EXPO_PUBLIC_ANALYTICS_WRITE_KEY),
      ENVIRONMENT !== 'production' ? createConsoleSink(logger) : null,
    ].filter(isDefined),
    consent,
    context: { app: APP_NAME, platform: PLATFORM, version: APP_VERSION },
    logger,
  });

  const i18n = createI18n(detectLocale(preferences.getState().locale));

  return {
    logger,
    preferences,
    consent,
    endpoints,
    session,
    analytics,
    i18n,
    queryClient: createQueryClient(),
    flags: createStaticFlagClient(),
  };
}

export type Services = ReturnType<typeof createServices>;
