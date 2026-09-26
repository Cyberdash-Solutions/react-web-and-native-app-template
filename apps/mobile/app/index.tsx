import { useAnalytics, useTrackScreen } from '@repo/analytics';
import { useAuth } from '@repo/auth';
import { useFeatureFlag } from '@repo/config/react';
import { useGreeting, useMessages } from '@repo/data';
import { formatRelativeTime, useTranslation } from '@repo/i18n';
import { a11y, Button, Card, Screen, Stack, Text, useReducedMotion, useTheme } from '@repo/ui';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { Link, Stack as RouterStack } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, RefreshControl } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import icon from '../assets/icon.png';
import { ConsentCard } from '../src/components/ConsentCard';
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
  // 9.2 / 7.3 — Reanimated entrance, skipped when the OS asks for reduced motion.
  const reducedMotion = useReducedMotion();
  const { colors } = useTheme();
  useTrackScreen('home');

  useEffect(() => {
    if (greeting.data) analytics.track('greeting_viewed', { variant, authenticated: signedIn });
  }, [analytics, greeting.data, signedIn, variant]);

  const name = greeting.data?.name;
  const headline = !name || name === 'world' ? t('helloWorld') : t('hello', { name });

  const header = (
    <Stack gap="lg">
      <RouterStack.Screen
        options={{
          headerRight: () => (
            <Link href={href('settings')} asChild>
              <Pressable {...a11y.button(t('settings'))} hitSlop={12}>
                <Text tone="primary" variant="label">
                  {t('settings')}
                </Text>
              </Pressable>
            </Link>
          ),
        }}
      />
      <ConsentCard />
      {/* 7.3 — expo-image: memory + disk caching, used for every remote or bundled image. */}
      <Image
        source={icon}
        style={{ width: 48, height: 48, borderRadius: 12 }}
        cachePolicy="memory-disk"
        accessibilityIgnoresInvertColors
        alt=""
      />
      <Card>
        {greeting.isPending ? (
          <Text {...a11y.status()} tone="muted">
            {t('loading')}
          </Text>
        ) : greeting.isError ? (
          <QueryError error={greeting.error} onRetry={() => void greeting.refetch()} />
        ) : (
          <Animated.View
            entering={reducedMotion ? undefined : FadeIn.duration(320)}
            style={{ gap: 8 }}
          >
            <Text variant="display" headingLevel={1}>
              {variant === 'enthusiastic' ? `${headline} 🎉` : headline}
            </Text>
            <Text tone="muted">
              {t('servedAt', { time: formatRelativeTime(greeting.data.servedAt, i18n.language) })}
            </Text>
          </Animated.View>
        )}
        {!signedIn && auth.status !== 'unknown' ? (
          <Link href={href('signIn')} asChild>
            <Button title={t('signIn')} />
          </Link>
        ) : null}
        {signedIn ? (
          <Link href={href('profile')} asChild>
            <Button title={t('profile')} variant="secondary" />
          </Link>
        ) : null}
      </Card>
      {whatsNew ? (
        <Card>
          <Text>{t('whatsNew')}</Text>
        </Card>
      ) : null}
    </Stack>
  );

  if (!signedIn) return <Screen>{header}</Screen>;
  return (
    <Messages
      header={header}
      refreshColor={colors.primary}
      onRefresh={() => void greeting.refetch()}
    />
  );
}

/** 7.3 — FlashList for long, recycled lists. */
function Messages({
  header,
  refreshColor,
  onRefresh,
}: {
  header: React.ReactElement;
  refreshColor: string;
  onRefresh: () => void;
}) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const messages = useMessages();
  return (
    <FlashList
      data={messages.data ?? []}
      keyExtractor={(m) => m.id}
      contentContainerStyle={{ padding: spacing.lg }}
      ListHeaderComponent={
        <Stack gap="md" style={{ marginBottom: spacing.md }}>
          {header}
          {messages.isError ? (
            <QueryError error={messages.error} onRetry={() => void messages.refetch()} />
          ) : null}
          {messages.data ? (
            <Text variant="heading" headingLevel={2}>
              {t('messages', { count: messages.data.length })}
            </Text>
          ) : null}
        </Stack>
      }
      renderItem={({ item }) => (
        <Link href={href('message', { id: item.id })} asChild>
          <Pressable {...a11y.button(item.text)} style={{ paddingVertical: spacing.sm }}>
            <Text tone="primary">{item.text}</Text>
          </Pressable>
        </Link>
      )}
      onEndReached={() =>
        messages.hasNextPage && !messages.isFetchingNextPage && void messages.fetchNextPage()
      }
      onEndReachedThreshold={0.5}
      refreshControl={
        <RefreshControl
          refreshing={messages.isRefetching}
          tintColor={refreshColor}
          onRefresh={() => {
            onRefresh();
            void messages.refetch();
          }}
        />
      }
    />
  );
}
