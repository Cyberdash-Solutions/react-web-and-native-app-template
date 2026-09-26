import { useTrackScreen } from '@repo/analytics';
import { useAuth } from '@repo/auth';
import { useMessage } from '@repo/data';
import { formatDate, useTranslation } from '@repo/i18n';
import { Card, Screen, Text } from '@repo/ui';
import { Redirect, useLocalSearchParams } from 'expo-router';

import { QueryError } from '../../src/components/QueryError';
import { href } from '../../src/routes';

/** 11.3 — deep-link target: /messages/:id resolves here on web and on mobile. */
export default function MessageScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const auth = useAuth();
  const message = useMessage(id);
  useTrackScreen('message');

  if (auth.status === 'signedOut') return <Redirect href={href('signIn')} />;
  return (
    <Screen>
      <Card>
        {message.isPending ? <Text tone="muted">{t('loading')}</Text> : null}
        {message.isError ? (
          <QueryError error={message.error} onRetry={() => void message.refetch()} />
        ) : null}
        {message.data ? (
          <>
            <Text variant="title" headingLevel={1}>
              {message.data.text}
            </Text>
            <Text tone="muted">
              {formatDate(message.data.createdAt, i18n.language, {
                dateStyle: 'long',
                timeStyle: 'short',
              })}
            </Text>
          </>
        ) : null}
      </Card>
    </Screen>
  );
}
