import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, tones } from '@/constants/theme';
import type { Measurement } from '@/types/database';
import { formatDateTime } from '@/utils/format';
import { MEASUREMENT_META, formatMeasurementValue } from '@/utils/measurements';

type Props = {
  measurement: Measurement;
  /** Con borde y fondo de tarjeta (historial) o sin ellos (dentro de otra tarjeta). */
  bordered?: boolean;
};

export function MeasurementItem({ measurement, bordered = true }: Props) {
  const meta = MEASUREMENT_META[measurement.measurement_type];
  const palette = tones[meta.tone];

  return (
    <View style={[styles.row, bordered ? styles.bordered : styles.plain]}>
      <View style={[styles.iconCircle, { backgroundColor: palette.bg }]}>
        <Ionicons name={meta.icon} size={20} color={palette.fg} />
      </View>
      <View style={styles.texts}>
        <Text style={styles.type}>{meta.label}</Text>
        <Text style={styles.value}>{formatMeasurementValue(measurement)}</Text>
        <Text style={styles.time}>{formatDateTime(measurement.recorded_at)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 4 },
  bordered: {
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  plain: { paddingVertical: spacing.sm + 2 },
  iconCircle: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  texts: { flex: 1, gap: 1 },
  type: { fontSize: 12, color: colors.textMuted },
  value: { fontSize: 17, fontWeight: '700', color: colors.text },
  time: { fontSize: 12, color: colors.textMuted },
});