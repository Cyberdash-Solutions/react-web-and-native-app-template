import { useTrackScreen, useAnalytics } from '@repo/core/analytics';
import { useAuth } from '@repo/core/auth';
import { useFeatureFlag } from '@repo/core/config/react';
import { useGreeting, useMessages } from '@repo/core/data';
import { formatRelativeTime, useTranslation } from '@repo/core/i18n';
import { a11y, Button, Card, Screen, Stack, Text } from '@repo/ui';
import { Link } from 'expo-router';
import Head from 'expo-router/head';
import { useEffect } from 'react';

import { QueryError } from '../src/components/QueryError';
import { href } from '../src/routes';

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const auth = useAuth();
  const signedIn = auth.status === 'signedIn' || auth.status === 'refreshing';
  const greeting = useGreeting();
  const whatsNew = useFeatureFlag('home.whats-new');
  const variant = useFeatureFlag('home.greeting-variant');
  const analytics = useAnalytics();
  useTrackScreen('home');

  useEffect(() => {
    if (greeting.data) analytics.track('greeting_viewed', { variant, authenticated: signedIn });
  }, [analytics, greeting.data, signedIn, variant]);

  const name = greeting.data?.name;
  const headline = !name || name === 'world' ? t('helloWorld') : t('hello', { name });

  return (
    <Screen>
      <Head>
        <title>{t('appName')}</title>
      </Head>
      <Card>
        {greeting.isPending ? (
          <Text {...a11y.status()} aria-busy tone="muted">
            {t('loading')}
          </Text>
        ) : greeting.isError ? (
          <QueryError error={greeting.error} onRetry={() => void greeting.refetch()} />
        ) : (
          <Stack gap="sm">
            <Text variant="display" headingLevel={1}>
              {variant === 'enthusiastic' ? `${headline} 🎉` : headline}
            </Text>
            <Text tone="muted">
              {t('servedAt', { time: formatRelativeTime(greeting.data.servedAt, i18n.language) })}
            </Text>
          </Stack>
        )}
        {!signedIn && auth.status !== 'unknown' ? (
          <>
            <Link href={href('signIn')} asChild>
              <Button title={t('signIn')} />
            </Link>
            <Link href={href('signUp')} asChild>
              <Button title={t('signUp')} variant="secondary" />
            </Link>
          </>
        ) : null}
      </Card>

      {whatsNew ? (
        <Card>
          <Text>{t('whatsNew')}</Text>
        </Card>
      ) : null}

      {signedIn ? <Messages /> : null}
    </Screen>
  );
}

function Messages() {
  const { t } = useTranslation();
  const messages = useMessages();
  if (messages.isPending) return <Text tone="muted">{t('loading')}</Text>;
  if (messages.isError)
    return <QueryError error={messages.error} onRetry={() => void messages.refetch()} />;
  return (
    <Card>
      <Text variant="heading" headingLevel={2}>
        {t('messages', { count: messages.data.length })}
      </Text>
      <Stack gap="xs" role="list">
        {messages.data.map((m) => (
          <Link key={m.id} href={href('message', { id: m.id })} role="listitem">
            <Text tone="primary">{m.text}</Text>
          </Link>
        ))}
      </Stack>
      {messages.hasNextPage ? (
        <Button
          title={t('loadMore')}
          variant="secondary"
          loading={messages.isFetchingNextPage}
          onPress={() => void messages.fetchNextPage()}
        />
      ) : null}
    </Card>
  );
}
