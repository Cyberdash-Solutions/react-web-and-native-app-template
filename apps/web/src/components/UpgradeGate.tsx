import { useUpgradeRequired } from '@repo/data';
import { useTranslation } from '@repo/i18n';
import { Button, Card, Screen, Text } from '@repo/ui';
import type { ReactNode } from 'react';

import { APP_VERSION } from '../app-info';

/** 12.6 — the server's minimum supported version gates the app. On web a reload fetches the new build. */
export function UpgradeGate({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  if (!useUpgradeRequired('web', APP_VERSION)) return children;
  return (
    <Screen>
      <Card>
        <Text variant="title" headingLevel={1}>
          {t('upgradeRequired')}
        </Text>
        <Button title={t('retry')} onPress={() => window.location.reload()} />
      </Card>
    </Screen>
  );
}
