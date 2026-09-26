import { View } from 'react-native';

import { a11y } from '../a11y';
import { useTheme } from '../theme';
import { Button } from './Button';
import type { ErrorFallbackProps } from './ErrorFallback.types';
import { Text } from './Text';

/** 5.2 — Web fallback: a full reload is the most reliable recovery (new bundle, clean state). */
export function ErrorFallback({ labels }: ErrorFallbackProps) {
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
      <Button title={labels.retry} onPress={() => window.location.reload()} />
    </View>
  );
}
