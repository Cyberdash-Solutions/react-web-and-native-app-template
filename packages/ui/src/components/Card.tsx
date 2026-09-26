import { View, type ViewProps } from 'react-native';

import { useTheme } from '../theme';

export function Card({ style, ...rest }: ViewProps) {
  const { colors, spacing, radii } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: radii.lg,
          padding: spacing.lg,
          gap: spacing.md,
        },
        style,
      ]}
      {...rest}
    />
  );
}
