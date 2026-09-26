import { View, type ViewProps } from 'react-native';

import { useTheme } from '../theme';
import type { Spacing } from '../tokens';

export interface StackProps extends ViewProps {
  gap?: Spacing;
  direction?: 'row' | 'column';
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  wrap?: boolean;
}

export function Stack({
  gap = 'md',
  direction = 'column',
  align,
  wrap,
  style,
  ...rest
}: StackProps) {
  const { spacing } = useTheme();
  return (
    <View
      style={[
        {
          gap: spacing[gap],
          flexDirection: direction,
          alignItems: align,
          flexWrap: wrap ? 'wrap' : undefined,
        },
        style,
      ]}
      {...rest}
    />
  );
}
