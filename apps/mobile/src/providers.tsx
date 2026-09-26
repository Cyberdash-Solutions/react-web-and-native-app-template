import { AnalyticsProvider } from '@repo/analytics';
import { AuthProvider, AuthScopedDataProvider } from '@repo/auth';
import { FeatureFlagProvider } from '@repo/config/react';
import { applyDirection, I18nextProvider, useTranslation } from '@repo/i18n';
import { PreferencesProvider, usePreferences } from '@repo/state';
import { ErrorBoundary, ThemeProvider } from '@repo/ui';
import { useEffect, type ReactNode } from 'react';

import { captureException } from './monitoring';
import type { Services } from './services';

function ThemedRoot({ children }: { children: ReactNode }) {
  const preference = usePreferences((s) => s.colorScheme);
  return <ThemeProvider preference={preference}>{children}</ThemeProvider>;
}

/** Keeps i18next and the layout direction (I18nManager) in sync with the language preference (10.3). */
function LocaleSync({ services }: { services: Services }) {
  const locale = usePreferences((s) => s.locale);
  useEffect(() => {
    const next = locale ?? services.i18n.language;
    void services.i18n.changeLanguage(next);
    applyDirection(next);
  }, [locale, services.i18n]);
  return null;
}

function AppErrorBoundary({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <ErrorBoundary
      labels={{ title: t('errors:boundaryTitle'), retry: t('retry') }}
      onError={(error, info) => captureException(error, { componentStack: info.componentStack })}
    >
      {children}
    </ErrorBoundary>
  );
}

export function AppProviders({ services, children }: { services: Services; children: ReactNode }) {
  return (
    <PreferencesProvider store={services.preferences}>
      <ThemedRoot>
        <I18nextProvider i18n={services.i18n}>
          <LocaleSync services={services} />
          <AppErrorBoundary>
            <FeatureFlagProvider client={services.flags}>
              <AnalyticsProvider analytics={services.analytics} consent={services.consent}>
                <AuthProvider session={services.session}>
                  <AuthScopedDataProvider
                    endpoints={services.endpoints}
                    queryClient={services.queryClient}
                  >
                    {children}
                  </AuthScopedDataProvider>
                </AuthProvider>
              </AnalyticsProvider>
            </FeatureFlagProvider>
          </AppErrorBoundary>
        </I18nextProvider>
      </ThemedRoot>
    </PreferencesProvider>
  );
}
