import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, tones } from '@/constants/theme';
import type { DeviceAlert } from '@/types/alerts';
import { ALERT_SEVERITY_META } from '@/utils/alerts';
import { formatClock } from '@/utils/dashboard';

type Props = {
  alert: DeviceAlert;
  divider: boolean;
};

// Fila de alerta para las listas de actividad reciente.
export function AlertActivityRow({ alert, divider }: Props) {
  const meta = ALERT_SEVERITY_META[alert.severity];
  const palette = tones[meta.tone];

  return (
    <View style={[styles.row, divider && styles.divider]}>
      <View style={[styles.iconCircle, { backgroundColor: palette.bg }]}>
        <Ionicons name={meta.icon} size={18} color={palette.fg} />
      </View>
      <View style={styles.texts}>
        <Text style={styles.title}>{alert.title}</Text>
        <Text style={styles.sub}>Alerta · {meta.label}</Text>
      </View>
      <Text style={styles.time}>{formatClock(alert.timestamp)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
    paddingVertical: spacing.sm + 2,
  },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  iconCircle: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  texts: { flex: 1, gap: 1 },
  title: { fontSize: 15, color: colors.text },
  sub: { fontSize: 12, color: colors.textMuted },
  time: { fontSize: 12, color: colors.textMuted },
});