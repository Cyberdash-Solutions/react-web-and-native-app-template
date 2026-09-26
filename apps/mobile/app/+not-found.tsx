import { useTranslation } from '@repo/core/i18n';
import { Card, Screen, Text } from '@repo/ui';
import { Link } from 'expo-router';

import { href } from '../src/routes';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <Screen>
      <Card>
        <Text variant="title" headingLevel={1}>
          {t('notFound')}
        </Text>
        <Link href={href('home')}>
          <Text tone="primary">{t('goHome')}</Text>
        </Link>
      </Card>
    </Screen>
  );
}
