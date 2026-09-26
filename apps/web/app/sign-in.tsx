import { useAnalytics, useTrackScreen } from '@repo/core/analytics';
import { useAuthSession } from '@repo/core/auth';
import { normalizeError, signInInputSchema } from '@repo/core/domain';
import { useTranslation } from '@repo/core/i18n';
import { a11y, Button, Card, Screen, Stack, Text, TextField } from '@repo/ui';
import { useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { useState } from 'react';

import { href } from '../src/routes';

export default function SignInScreen() {
  const { t } = useTranslation();
  const session = useAuthSession();
  const analytics = useAnalytics();
  const router = useRouter();
  useTrackScreen('sign-in');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    setFormError(null);
    // 2.1 — the same Zod schema validates here, on mobile, and (ideally) on the server.
    const parsed = signInInputSchema.safeParse({ email, password });
    if (!parsed.success) {
      const errors: typeof fieldErrors = {};
      for (const issue of parsed.error.issues)
        errors[issue.path[0] as 'email' | 'password'] ??= t(
          issue.message as 'validation:emailInvalid',
        );
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    try {
      await session.signIn(parsed.data);
      analytics.track('signed_in', { method: 'password' });
      router.replace(href('home'));
    } catch (error) {
      const appError = normalizeError(error);
      setFormError(
        appError.code === 'unauthorized'
          ? t('errors:invalidCredentials')
          : t(appError.userMessageKey),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <Head>
        <title>{`${t('signIn')} · ${t('appName')}`}</title>
      </Head>
      <Card>
        <Text variant="title" headingLevel={1}>
          {t('signIn')}
        </Text>
        <Stack gap="md">
          <TextField
            label={t('email')}
            value={email}
            onChangeText={setEmail}
            autoComplete="email"
            keyboardType="email-address"
            autoCapitalize="none"
            error={fieldErrors.email}
          />
          <TextField
            label={t('password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="current-password"
            error={fieldErrors.password}
            onSubmitEditing={onSubmit}
          />
          {formError ? (
            <Text {...a11y.alert()} tone="danger">
              {formError}
            </Text>
          ) : null}
          <Button title={t('signIn')} loading={submitting} onPress={onSubmit} />
        </Stack>
      </Card>
    </Screen>
  );
}
