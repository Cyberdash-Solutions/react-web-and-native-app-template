import { normalizeError } from '@repo/core/domain';
import { useTranslation } from '@repo/core/i18n';
import { a11y, Button, Stack, Text } from '@repo/ui';

/** 5.1 — renders any error through its user-facing message key. */
export function QueryError({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { t } = useTranslation();
  const appError = normalizeError(error);
  return (
    <Stack gap="sm" {...a11y.alert()}>
      <Text tone="danger">{t(appError.userMessageKey)}</Text>
      {onRetry && appError.retryable ? (
        <Button title={t('retry')} variant="secondary" onPress={onRetry} />
      ) : null}
    </Stack>
  );
}
