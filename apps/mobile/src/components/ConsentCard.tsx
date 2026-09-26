import { useConsent } from '@repo/analytics';
import { useTranslation } from '@repo/i18n';
import { Button, Card, Stack, Text } from '@repo/ui';

import { requestTrackingIfNeeded } from '../tracking';

/** 14.1 / 14.2 — explicit opt-in before any analytics; iOS also asks for ATT. */
export function ConsentCard() {
  const { t } = useTranslation('consent');
  const { decided, setGranted } = useConsent();
  if (decided) return null;
  const accept = async () => setGranted(await requestTrackingIfNeeded());
  return (
    <Card>
      <Text variant="heading" headingLevel={2}>
        {t('title')}
      </Text>
      <Text tone="muted">{t('body')}</Text>
      <Stack direction="row" gap="md" wrap>
        <Button title={t('accept')} onPress={accept} />
        <Button title={t('decline')} variant="secondary" onPress={() => setGranted(false)} />
      </Stack>
    </Card>
  );
}
