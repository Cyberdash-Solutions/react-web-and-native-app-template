import { useUpgradeRequired } from '@repo/core/data';
import { useTranslation } from '@repo/core/i18n';
import { Button, Card, Screen, Text } from '@repo/ui';
import type { ReactNode } from 'react';
import { Linking, Platform } from 'react-native';

import { APP_VERSION } from '../app-info';

const STORE_URL = Platform.select({
  ios: 'https://apps.apple.com/app/idREPLACE_ME',
  default: 'https://play.google.com/store/apps/details?id=com.example.helloworld',
});

/** 12.6 — old binaries below the server's minimum supported version are sent to the store. */
export function UpgradeGate({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  if (!useUpgradeRequired('mobile', APP_VERSION)) return children;
  return (
    <Screen>
      <Card>
        <Text variant="title" headingLevel={1}>
          {t('upgradeRequired')}
        </Text>
        <Button title={t('retry')} onPress={() => void Linking.openURL(STORE_URL)} />
      </Card>
    </Screen>
  );
}
