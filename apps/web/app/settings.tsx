import { useAnalytics, useConsent, useTrackScreen } from '@repo/core/analytics';
import { useAuth, useAuthSession } from '@repo/core/auth';
import { languageName, supportedLocales, useTranslation } from '@repo/core/i18n';
import { usePreferences, type ColorSchemePreference } from '@repo/core/state';
import { useInstallPrompt } from '../src/pwa';
import { Button, Card, SegmentedControl, Screen, Text, ToggleRow } from '@repo/ui';
import { Link, useRouter } from 'expo-router';
import Head from 'expo-router/head';

import { href } from '../src/routes';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const colorScheme = usePreferences((s) => s.colorScheme);
  const setColorScheme = usePreferences((s) => s.setColorScheme);
  const locale = usePreferences((s) => s.locale);
  const setLocale = usePreferences((s) => s.setLocale);
  const consent = useConsent();
  const auth = useAuth();
  const session = useAuthSession();
  const analytics = useAnalytics();
  const router = useRouter();
  // 11.2 — offered only when the browser says the PWA is installable.
  const pwa = useInstallPrompt();
  useTrackScreen('settings');

  const signOut = async () => {
    analytics.track('signed_out', { reason: 'user' });
    await session.signOut();
    router.replace(href('home'));
  };

  return (
    <Screen>
      <Head>
        <title>{`${t('settings')} · ${t('appName')}`}</title>
      </Head>
      <Text variant="title" headingLevel={1}>
        {t('settings')}
      </Text>
      <Card>
        <Text variant="heading" headingLevel={2}>
          {t('settings:appearance')}
        </Text>
        <SegmentedControl<ColorSchemePreference>
          label={t('settings:appearance')}
          value={colorScheme}
          onChange={setColorScheme}
          options={(['system', 'light', 'dark'] as const).map((v) => ({
            value: v,
            label: t(`settings:theme_${v}`),
          }))}
        />
      </Card>
      <Card>
        <Text variant="heading" headingLevel={2}>
          {t('settings:language')}
        </Text>
        <SegmentedControl<string>
          label={t('settings:language')}
          value={locale ?? 'system'}
          onChange={(v) => setLocale(v === 'system' ? null : v)}
          options={[
            { value: 'system', label: t('settings:language_system') },
            ...supportedLocales.map((l) => ({
              value: l,
              label: languageName(l),
            })),
          ]}
        />
      </Card>
      <Card>
        <ToggleRow
          label={t('settings:analytics')}
          value={consent.granted === true}
          onChange={consent.setGranted}
        />
        <Link href={href('privacy')}>
          <Text tone="primary">{t('privacy')}</Text>
        </Link>
      </Card>
      {pwa.canInstall ? (
        <Button title={t('installApp')} variant="secondary" onPress={() => void pwa.install()} />
      ) : null}
      {auth.status === 'signedIn' ? (
        <Button title={t('signOut')} variant="secondary" onPress={signOut} />
      ) : null}
    </Screen>
  );
}
