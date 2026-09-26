import {
  createAnalytics,
  createConsentStore,
  AnalyticsProvider,
  type AnalyticsSink,
} from '@repo/analytics';
import { createApiClient, createEndpoints } from '@repo/api-client';
import {
  AuthProvider,
  AuthScopedDataProvider,
  createAuthSession,
  createMemoryTokenStorage,
  type AuthSession,
} from '@repo/auth';
import { createStaticFlagClient, type FeatureFlagValues } from '@repo/config';
import { FeatureFlagProvider } from '@repo/config/react';
import { createQueryClient } from '@repo/data';
import { createI18n, I18nextProvider, type Locale } from '@repo/i18n';
import { createMemoryStorage, createPreferencesStore, PreferencesProvider } from '@repo/state';
import { ThemeProvider } from '@repo/ui';
import type { QueryClient } from '@tanstack/react-query';
import type { ReactElement, ReactNode } from 'react';

import { fixtures } from '../fixtures';
import { API_URL } from '../mocks/handlers';

export interface ProviderOptions {
  locale?: Locale;
  scheme?: 'light' | 'dark';
  flags?: Partial<FeatureFlagValues>;
  /** Start with a signed-in session (fixtures.user) instead of signed out. */
  signedIn?: boolean;
  analyticsConsent?: boolean | null;
  queryClient?: QueryClient;
}

export interface TestContext {
  wrapper: (props: { children: ReactNode }) => ReactElement;
  queryClient: QueryClient;
  session: AuthSession;
  analyticsEvents: { name: string; properties: unknown }[];
}

/**
 * 13.8 — The real providers (Query client, theme, i18n, auth, analytics, flags, preferences) with
 * test defaults, backed by in-memory storage and the MSW mock backend.
 */
export function createTestContext(options: ProviderOptions = {}): TestContext {
  const queryClient = options.queryClient ?? createQueryClient({ retry: false });
  const storage = createMemoryTokenStorage(options.signedIn ? fixtures.tokens.refreshToken : null);
  // eslint-disable-next-line prefer-const
  let session: AuthSession;
  const client = createApiClient({
    baseUrl: API_URL,
    retries: 0,
    getAccessToken: () => session.getAccessToken(),
    refreshAuth: () => session.refresh(),
  });
  const endpoints = createEndpoints(client);
  // signedIn: a stored refresh token, restored on mount exactly like an app relaunch.
  session = createAuthSession({
    storage,
    api: () => endpoints,
    initialState: options.signedIn ? undefined : { status: 'signedOut', reason: 'initial' },
  });

  const i18n = createI18n(options.locale ?? 'en');
  const preferences = createPreferencesStore(createMemoryStorage());
  const consent = createConsentStore(createMemoryStorage());
  if (options.analyticsConsent !== undefined && options.analyticsConsent !== null)
    consent.getState().setAnalyticsConsent(options.analyticsConsent);
  const analyticsEvents: TestContext['analyticsEvents'] = [];
  const sink: AnalyticsSink = {
    name: 'test',
    send: (e) => analyticsEvents.push({ name: e.name, properties: e.properties }),
  };
  const analytics = createAnalytics({ sinks: [sink], consent, context: { app: 'test' } });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <PreferencesProvider store={preferences}>
      <ThemeProvider preference={options.scheme ?? 'light'}>
        <I18nextProvider i18n={i18n}>
          <FeatureFlagProvider client={createStaticFlagClient(options.flags)}>
            <AnalyticsProvider analytics={analytics} consent={consent}>
              <AuthProvider session={session}>
                <AuthScopedDataProvider endpoints={endpoints} queryClient={queryClient}>
                  {children}
                </AuthScopedDataProvider>
              </AuthProvider>
            </AnalyticsProvider>
          </FeatureFlagProvider>
        </I18nextProvider>
      </ThemeProvider>
    </PreferencesProvider>
  );

  return { wrapper, queryClient, session, analyticsEvents };
}
