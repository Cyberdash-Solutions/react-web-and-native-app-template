import { useAnalytics, useConsent, useTrackScreen } from '@repo/core/analytics';
import { biometricsSupported, useAuth, useAuthSession } from '@repo/core/auth';
import { supportedLocales, useTranslation } from '@repo/core/i18n';
import { usePreferences, type ColorSchemePreference } from '@repo/core/state';
import { Button, Card, SegmentedControl, Screen, Text, ToggleRow } from '@repo/ui';
import { Link, useRouter } from 'expo-router';

import { href } from '../src/routes';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const colorScheme = usePreferences((s) => s.colorScheme);
  const setColorScheme = usePreferences((s) => s.setColorScheme);
  const locale = usePreferences((s) => s.locale);
  const setLocale = usePreferences((s) => s.setLocale);
  const biometricLock = usePreferences((s) => s.biometricLock);
  const setBiometricLock = usePreferences((s) => s.setBiometricLock);
  const consent = useConsent();
  const auth = useAuth();
  const session = useAuthSession();
  const analytics = useAnalytics();
  const router = useRouter();
  useTrackScreen('settings');

  const signOut = async () => {
    analytics.track('signed_out', { reason: 'user' });
    await session.signOut();
    router.dismissTo(href('home'));
  };

  return (
    <Screen>
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
              label: new Intl.DisplayNames([l], { type: 'language' }).of(l) ?? l,
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
      {biometricsSupported && auth.status === 'signedIn' ? (
        <Card>
          <ToggleRow label={t('biometricLock')} value={biometricLock} onChange={setBiometricLock} />
        </Card>
      ) : null}
      {auth.status === 'signedIn' ? (
        <Button title={t('signOut')} variant="secondary" onPress={signOut} />
      ) : null}
    </Screen>
  );
}
