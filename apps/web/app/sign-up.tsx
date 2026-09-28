import { useAnalytics, useTrackScreen } from '@repo/core/analytics';
import { useAuthSession } from '@repo/core/auth';
import { normalizeError, signUpInputSchema, type SignUpInput } from '@repo/core/domain';
import { useTranslation } from '@repo/core/i18n';
import { a11y, Button, Card, Screen, Stack, Text, TextField, useTheme } from '@repo/ui';
import { Link, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { useState } from 'react';

import { href } from '../src/routes';

type Field = keyof SignUpInput;

export default function SignUpScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const session = useAuthSession();
  const analytics = useAnalytics();
  const router = useRouter();
  useTrackScreen('sign-up');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    setFormError(null);
    // 2.1 — the same Zod schema validates here, on mobile, and in the (fake) backend's rules.
    const parsed = signUpInputSchema.safeParse({ name, email, password });
    if (!parsed.success) {
      const errors: typeof fieldErrors = {};
      for (const issue of parsed.error.issues)
        errors[issue.path[0] as Field] ??= t(issue.message as 'validation:emailInvalid');
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    try {
      await session.signUp(parsed.data);
      analytics.track('signed_up', { method: 'password' });
      router.replace(href('home'));
    } catch (error) {
      const appError = normalizeError(error);
      setFormError(
        appError.code === 'conflict' ? t('errors:emailTaken') : t(appError.userMessageKey),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <Head>
        <title>{`${t('signUp')} · ${t('appName')}`}</title>
      </Head>
      <Card>
        <Text variant="title" headingLevel={1}>
          {t('signUp')}
        </Text>
        <Stack gap="md">
          <TextField
            label={t('name')}
            value={name}
            onChangeText={setName}
            autoComplete="name"
            error={fieldErrors.name}
          />
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
            autoComplete="new-password"
            error={fieldErrors.password}
            onSubmitEditing={onSubmit}
          />
          {formError ? (
            <Text {...a11y.alert()} tone="danger">
              {formError}
            </Text>
          ) : null}
          <Button title={t('signUp')} loading={submitting} onPress={onSubmit} />
          <Text tone="muted">
            {t('haveAccount')}{' '}
            <Link href={href('signIn')} style={{ color: colors.primary, fontWeight: '600' }}>
              {t('signIn')}
            </Link>
          </Text>
        </Stack>
      </Card>
    </Screen>
  );
}
