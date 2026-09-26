import { View } from 'react-native';

import { a11y } from '../a11y';
import { useTheme } from '../theme';
import { Button } from './Button';
import type { ErrorFallbackProps } from './ErrorFallback.types';
import { Text } from './Text';

/** 5.2 — Mobile fallback: re-mount the subtree (an OTA reload is the app's call, not ui's). */
export function ErrorFallback({ reset, labels }: ErrorFallbackProps) {
  const { colors, spacing } = useTheme();
  return (
    <View
      {...a11y.alert()}
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xl,
        gap: spacing.lg,
        backgroundColor: colors.background,
      }}
    >
      <Text variant="title" headingLevel={1}>
        {labels.title}
      </Text>
      <Button title={labels.retry} onPress={reset} />
    </View>
  );
}
