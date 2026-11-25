import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/constants/theme';
import type { DataSource } from '@/types/measurements';

type Props = {
  value: DataSource;
  onChange: (value: DataSource) => void;
};

const OPTIONS: ReadonlyArray<{ key: DataSource; label: string }> = [
  { key: 'real', label: 'Datos reales' },
  { key: 'simulated', label: 'Simulados' },
];

export function SourceSwitch({ value, onChange }: Props) {
  return (
    <View style={styles.container}>
      {OPTIONS.map((option) => {
        const selected = option.key === value;
        return (
          <Pressable
            key={option.key}
            onPress={() => onChange(option.key)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={[styles.segment, selected && styles.segmentSelected]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: radius.md,
    backgroundColor: colors.neutralSoft,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md - 4,
  },
  segmentSelected: { backgroundColor: colors.surface },
  label: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  labelSelected: { color: colors.text },
});