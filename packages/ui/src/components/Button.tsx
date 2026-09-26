import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type PressableProps,
  type PressableStateCallbackType,
} from 'react-native';

import { a11y } from '../a11y';
import { useTheme } from '../theme';
import { Text } from './Text';

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  title: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
  accessibilityHint?: string;
}

/** On web, react-native-web adds `hovered` and `focused` to the Pressable state (8.4). */
type WebPressableState = PressableStateCallbackType & { hovered?: boolean; focused?: boolean };

export function Button({
  title,
  variant = 'primary',
  loading = false,
  disabled,
  ...rest
}: ButtonProps) {
  const { colors, spacing, radii, layout } = useTheme();
  const isDisabled = disabled || loading;
  const bg = {
    primary: colors.primary,
    secondary: colors.surface,
    ghost: 'transparent',
    danger: colors.danger,
  }[variant];
  const fg = variant === 'primary' || variant === 'danger' ? colors.onPrimary : colors.primary;

  return (
    <Pressable
      // Spread first: wrappers such as expo-router's <Link asChild> inject props (incl. `style`)
      // that must not replace the button's own.
      {...rest}
      // The title stays the accessible name while the spinner replaces the visible label (9.1).
      {...a11y.button(title, { disabled: isDisabled, busy: loading })}
      disabled={isDisabled}
      style={(state: WebPressableState) => [
        styles.base,
        {
          minHeight: layout.minTouchTarget,
          paddingHorizontal: spacing.lg,
          borderRadius: radii.md,
          // Hover/press darken the fill rather than fading it, so text contrast never drops (9.2).
          backgroundColor:
            variant === 'primary' && (state.pressed || state.hovered) ? colors.primaryPressed : bg,
          borderColor: variant === 'secondary' ? colors.border : 'transparent',
          opacity: isDisabled ? 0.5 : 1,
        },
        state.focused && {
          outlineColor: colors.focusRing,
          outlineStyle: 'solid',
          outlineWidth: 2,
          outlineOffset: 2,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} aria-hidden />
      ) : (
        <Text variant="label" style={{ color: fg }}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
});
