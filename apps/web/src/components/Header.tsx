import { useAuth } from '@repo/auth';
import { useTranslation } from '@repo/i18n';
import { Text, useTheme } from '@repo/ui';
import { Link } from 'expo-router';
import { View } from 'react-native';

import { href } from '../routes';

export function Header() {
  const { t } = useTranslation();
  const { colors, spacing, layout } = useTheme();
  const auth = useAuth();
  const signedIn = auth.status === 'signedIn' || auth.status === 'refreshing';
  const linkStyle = { color: colors.primary, fontWeight: '600' } as const;

  return (
    <View
      role="banner"
      style={{
        borderBottomWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        alignItems: 'center',
      }}
    >
      <View
        role="navigation"
        style={{
          width: '100%',
          maxWidth: layout.maxContentWidth,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.lg,
          padding: spacing.lg,
        }}
      >
        <Link href={href('home')}>
          <Text variant="heading">{t('appName')}</Text>
        </Link>
        <View style={{ flex: 1 }} />
        {signedIn ? (
          <Link href={href('profile')} style={linkStyle}>
            {t('profile')}
          </Link>
        ) : null}
        <Link href={href('settings')} style={linkStyle}>
          {t('settings')}
        </Link>
        {!signedIn ? (
          <Link href={href('signIn')} style={linkStyle}>
            {t('signIn')}
          </Link>
        ) : null}
      </View>
    </View>
  );
}
