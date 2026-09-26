import { Switch, View } from 'react-native';

import { useTheme } from '../theme';
import { Text } from './Text';

export function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange(value: boolean): void;
}) {
  const { spacing, colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.md,
      }}
    >
      <Text style={{ flex: 1 }}>{label}</Text>
      <Switch
        role="switch"
        aria-label={label}
        aria-checked={value}
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.primary, false: colors.border }}
      />
    </View>
  );
}
