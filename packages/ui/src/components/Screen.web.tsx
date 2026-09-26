import { ScrollView, View } from 'react-native';

import { useTheme } from '../theme';
import type { ScreenProps } from './Screen.types';

/**
 * 8.4 — Web: a centered, width-capped column. Sizing is pure layout (maxWidth), not JS
 * breakpoints, so statically rendered HTML never shifts on hydration (CLS, 6.5).
 */
export function Screen({ children, testID }: ScreenProps) {
  const { colors, spacing, layout } = useTheme();
  return (
    <ScrollView
      testID={testID}
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ alignItems: 'center' }}
    >
      <View
        role="main"
        style={{
          width: '100%',
          maxWidth: layout.maxContentWidth,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.xl,
          gap: spacing.lg,
        }}
      >
        {children}
      </View>
    </ScrollView>
  );
}
