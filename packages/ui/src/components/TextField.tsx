import { useId } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

import { a11y } from '../a11y';
import { useTheme } from '../theme';
import { Text } from './Text';

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string | null;
}

export function TextField({ label, error, ...rest }: TextFieldProps) {
  const { colors, spacing, radii, typography, layout } = useTheme();
  const id = useId();
  return (
    <View style={{ gap: spacing.xs }}>
      <Text variant="label" nativeID={`${id}-label`}>
        {label}
      </Text>
      <TextInput
        aria-label={label}
        aria-labelledby={`${id}-label`}
        aria-invalid={!!error}
        placeholderTextColor={colors.textMuted}
        style={[
          typography.body,
          {
            minHeight: layout.minTouchTarget,
            color: colors.text,
            backgroundColor: colors.surface,
            borderColor: error ? colors.danger : colors.border,
            borderWidth: 1,
            borderRadius: radii.md,
            paddingHorizontal: spacing.md,
          },
        ]}
        {...rest}
      />
      {error ? (
        <Text {...a11y.alert()} variant="caption" tone="danger">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
