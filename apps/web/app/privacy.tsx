import { useAnalytics, useTrackScreen } from '@repo/core/analytics';
import { useAuth, useAuthSession } from '@repo/core/auth';
import { useDeleteAccount, useExportData } from '@repo/core/data';
import { useTranslation } from '@repo/core/i18n';
import { Button, Card, Screen, Text } from '@repo/ui';
import { useRouter } from 'expo-router';
import Head from 'expo-router/head';

import { href } from '../src/routes';

/** 14.3 cookie policy + 14.4 data export / delete (same API as mobile). */
export default function PrivacyScreen() {
  const { t } = useTranslation();
  const auth = useAuth();
  const session = useAuthSession();
  const analytics = useAnalytics();
  const router = useRouter();
  const exportData = useExportData();
  const deleteAccount = useDeleteAccount();
  useTrackScreen('privacy');

  const download = async () => {
    const data = await exportData.mutateAsync();
    analytics.track('data_exported');
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
    );
    const a = Object.assign(document.createElement('a'), { href: url, download: 'my-data.json' });
    a.click();
    URL.revokeObjectURL(url);
  };

  const remove = async () => {
    if (!window.confirm(t('deleteAccount'))) return;
    await deleteAccount.mutateAsync();
    analytics.track('signed_out', { reason: 'deleted' });
    await session.signOut('deleted');
    router.replace(href('home'));
  };

  return (
    <Screen>
      <Head>
        <title>{`${t('privacy')} · ${t('appName')}`}</title>
      </Head>
      <Card>
        <Text variant="title" headingLevel={1}>
          {t('consent:cookiePolicy')}
        </Text>
        <Text>{t('consent:body')}</Text>
      </Card>
      {auth.status === 'signedIn' ? (
        <Card>
          <Button
            title={t('exportData')}
            variant="secondary"
            loading={exportData.isPending}
            onPress={download}
          />
          {exportData.data ? (
            <Text tone="success">{t('exported', { count: exportData.data.messages.length })}</Text>
          ) : null}
          <Button
            title={t('deleteAccount')}
            variant="danger"
            loading={deleteAccount.isPending}
            onPress={remove}
          />
        </Card>
      ) : null}
    </Screen>
  );
}
