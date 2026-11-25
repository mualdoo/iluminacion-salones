import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { radius, spacing, tones, type Tone } from '@/constants/theme';
import type { IconName } from '@/types/ui';

type Props = {
  label: string;
  tone: Tone;
  icon?: IconName;
};

export function StatePill({ label, tone, icon }: Props) {
  const { fg, bg } = tones[tone];

  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      {icon ? <Ionicons name={icon} size={14} color={fg} /> : null}
      <Text style={[styles.label, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs + 2,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm + 4,
    borderRadius: radius.pill,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
});