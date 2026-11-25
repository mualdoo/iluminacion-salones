import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/dashboard/Card';
import { LIGHT_UNIT, MAX_LIGHT_LEVEL } from '@/constants/dashboard';
import { colors, radius, spacing, tones } from '@/constants/theme';
import type { TimeBandStats } from '@/types/analytics';
import { formatLevel } from '@/utils/analytics';

type BarProps = {
  label: string;
  range: string;
  /** Proporción 0..1. */
  ratio: number;
  valueText: string;
  color: string;
};

function HorizontalBar({ label, range, ratio, valueText, color }: BarProps) {
  const width = `${Math.round(Math.min(1, Math.max(0, ratio)) * 100)}%` as `${number}%`;
  return (
    <View style={styles.row}>
      <View style={styles.labelBlock}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.range}>{range}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width, backgroundColor: color }]} />
      </View>
      <Text style={styles.value}>{valueText}</Text>
    </View>
  );
}

export function TimeBandsCard({ bands }: { bands: TimeBandStats[] }) {
  const maxDetected = Math.max(0, ...bands.map((b) => b.motionDetected));

  return (
    <Card title="Distribución por franja horaria" icon="time-outline">
      <View style={styles.group}>
        <Text style={styles.groupTitle}>Movimiento detectado (eventos)</Text>
        {bands.map((band) => (
          <HorizontalBar
            key={`m-${band.key}`}
            label={band.label}
            range={band.range}
            ratio={maxDetected > 0 ? band.motionDetected / maxDetected : 0}
            valueText={String(band.motionDetected)}
            color={tones.info.fg}
          />
        ))}
      </View>

      <View style={styles.group}>
        <Text style={styles.groupTitle}>Iluminación promedio ({LIGHT_UNIT})</Text>
        {bands.map((band) => (
          <HorizontalBar
            key={`l-${band.key}`}
            label={band.label}
            range={band.range}
            ratio={band.lightAverage === null ? 0 : band.lightAverage / MAX_LIGHT_LEVEL}
            valueText={formatLevel(band.lightAverage)}
            color={colors.primary}
          />
        ))}
      </View>

      <Text style={styles.note}>
        Horario local del teléfono. Barras de movimiento relativas a la franja con más eventos;
        barras de iluminación sobre la escala 0–{MAX_LIGHT_LEVEL}.
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm + 2 },
  groupTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  labelBlock: { width: 92 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text },
  range: { fontSize: 10, color: colors.textMuted },
  track: {
    flex: 1,
    height: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.neutralSoft,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radius.pill },
  value: { width: 40, textAlign: 'right', fontSize: 13, fontWeight: '600', color: colors.text },
  note: { fontSize: 12, lineHeight: 17, color: colors.textMuted },
});