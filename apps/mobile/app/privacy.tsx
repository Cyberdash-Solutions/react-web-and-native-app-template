import { useAnalytics, useTrackScreen } from '@repo/core/analytics';
import { useAuth, useAuthSession } from '@repo/core/auth';
import { useDeleteAccount, useExportData } from '@repo/core/data';
import { useTranslation } from '@repo/core/i18n';
import { Button, Card, Screen, Text } from '@repo/ui';
import { useRouter } from 'expo-router';
import { Alert, Share } from 'react-native';

import { href } from '../src/routes';

/** 14.4 — data export / delete, backed by the same API as the web app. */
export default function PrivacyScreen() {
  const { t } = useTranslation();
  const auth = useAuth();
  const session = useAuthSession();
  const analytics = useAnalytics();
  const router = useRouter();
  const exportData = useExportData();
  const deleteAccount = useDeleteAccount();
  useTrackScreen('privacy');

  const share = async () => {
    const data = await exportData.mutateAsync();
    analytics.track('data_exported');
    await Share.share({ title: 'my-data.json', message: JSON.stringify(data, null, 2) });
  };

  const remove = () =>
    Alert.alert(t('deleteAccount'), undefined, [
      { text: t('back'), style: 'cancel' },
      {
        text: t('deleteAccount'),
        style: 'destructive',
        onPress: async () => {
          await deleteAccount.mutateAsync();
          analytics.track('signed_out', { reason: 'deleted' });
          await session.signOut('deleted');
          router.dismissTo(href('home'));
        },
      },
    ]);

  return (
    <Screen>
      <Card>
        <Text variant="title" headingLevel={1}>
          {t('privacy')}
        </Text>
        <Text>{t('consent:body')}</Text>
      </Card>
      {auth.status === 'signedIn' ? (
        <Card>
          <Button
            title={t('exportData')}
            variant="secondary"
            loading={exportData.isPending}
            onPress={share}
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
