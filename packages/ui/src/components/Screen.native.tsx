import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../theme';
import type { ScreenProps } from './Screen.types';

/** 8.4 — Mobile: safe areas + keyboard avoidance. */
export function Screen({ children, scroll = true, testID }: ScreenProps) {
  const { colors, spacing } = useTheme();
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    children
  );
  return (
    <SafeAreaView
      testID={testID}
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={['bottom', 'left', 'right']}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
