import { useConsent } from '@repo/analytics';
import { useTranslation } from '@repo/i18n';
import { Button, Stack, Text, useTheme } from '@repo/ui';
import { Link } from 'expo-router';
import { View } from 'react-native';

import { href } from '../routes';

/** 14.3 — Cookie consent banner. Nothing is tracked until the visitor accepts (14.1). */
export function ConsentBanner() {
  const { t } = useTranslation('consent');
  const { decided, setGranted } = useConsent();
  const { colors, spacing, layout } = useTheme();
  if (decided) return null;

  return (
    <View
      role="dialog"
      aria-label={t('title')}
      style={{
        position: 'fixed' as 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderColor: colors.border,
        padding: spacing.lg,
        alignItems: 'center',
      }}
    >
      <Stack gap="md" style={{ maxWidth: layout.maxContentWidth - 2 * spacing.lg, width: '100%' }}>
        <Text variant="heading" headingLevel={2}>
          {t('title')}
        </Text>
        <Text tone="muted">{t('body')}</Text>
        <Stack direction="row" gap="md" wrap align="center">
          <Button title={t('accept')} onPress={() => setGranted(true)} />
          <Button title={t('decline')} variant="secondary" onPress={() => setGranted(false)} />
          <Link href={href('privacy')} style={{ color: colors.primary }}>
            {t('cookiePolicy')}
          </Link>
        </Stack>
      </Stack>
    </View>
  );
}
