import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { a11y } from '../a11y';
import { useTheme } from '../theme';
import type { TypographyVariant } from '../tokens';

export interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  tone?: 'default' | 'muted' | 'danger' | 'success' | 'primary';
  /** Renders as a heading for screen readers (9.1). */
  headingLevel?: 1 | 2 | 3 | 4;
}

export function Text({
  variant = 'body',
  tone = 'default',
  headingLevel,
  style,
  ...rest
}: TextProps) {
  const { typography, colors } = useTheme();
  const color = {
    default: colors.text,
    muted: colors.textMuted,
    danger: colors.danger,
    success: colors.success,
    primary: colors.primary,
  }[tone];
  return (
    <RNText
      {...(headingLevel ? a11y.heading(headingLevel) : {})}
      style={[typography[variant], { color }, style]}
      {...rest}
    />
  );
}
