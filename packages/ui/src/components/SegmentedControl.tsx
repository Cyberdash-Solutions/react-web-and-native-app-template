import { Pressable, View } from 'react-native';

import { a11y } from '../a11y';
import { useTheme } from '../theme';
import { Text } from './Text';

export interface SegmentedControlProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange(value: T): void;
}

export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
}: SegmentedControlProps<T>) {
  const { colors, spacing, radii, layout } = useTheme();
  return (
    <View
      role="radiogroup"
      aria-label={label}
      style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}
    >
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            {...a11y.radio(o.label, selected)}
            onPress={() => onChange(o.value)}
            style={{
              minHeight: layout.minTouchTarget,
              justifyContent: 'center',
              paddingHorizontal: spacing.md,
              borderRadius: radii.pill,
              borderWidth: 1,
              borderColor: selected ? colors.primary : colors.border,
              backgroundColor: selected ? colors.primary : colors.surface,
            }}
          >
            <Text variant="label" style={{ color: selected ? colors.onPrimary : colors.text }}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
