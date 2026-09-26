import { useAnalytics, useTrackScreen } from '@repo/core/analytics';
import { useAuth } from '@repo/core/auth';
import { useMe, useUpdateProfile } from '@repo/core/data';
import { updateProfileInputSchema } from '@repo/core/domain';
import { useTranslation } from '@repo/core/i18n';
import { Button, Card, Screen, Text, TextField } from '@repo/ui';
import { Redirect } from 'expo-router';
import Head from 'expo-router/head';
import { useState } from 'react';

import { QueryError } from '../src/components/QueryError';
import { href } from '../src/routes';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const auth = useAuth();
  const me = useMe(auth.status === 'signedIn');
  const update = useUpdateProfile();
  const analytics = useAnalytics();
  const [name, setName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  useTrackScreen('profile');

  if (auth.status === 'signedOut') return <Redirect href={href('signIn')} />;

  const value = name ?? me.data?.name ?? '';
  const save = () => {
    const parsed = updateProfileInputSchema.safeParse({ name: value });
    if (!parsed.success)
      return setError(t(parsed.error.issues[0]!.message as 'validation:nameRequired'));
    setError(null);
    update.mutate(parsed.data, { onSuccess: () => analytics.track('profile_updated') });
  };

  return (
    <Screen>
      <Head>
        <title>{`${t('profile')} · ${t('appName')}`}</title>
      </Head>
      <Card>
        <Text variant="title" headingLevel={1}>
          {t('profile')}
        </Text>
        {me.isError ? <QueryError error={me.error} onRetry={() => void me.refetch()} /> : null}
        {update.isError ? <QueryError error={update.error} /> : null}
        <TextField label={t('name')} value={value} onChangeText={setName} error={error} />
        <Button title={t('save')} loading={update.isPending} onPress={save} />
      </Card>
    </Screen>
  );
}
