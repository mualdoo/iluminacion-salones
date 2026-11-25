import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/dashboard/Card';
import { StatePill } from '@/components/dashboard/StatePill';
import { LIGHT_UNIT, MAX_LIGHT_LEVEL } from '@/constants/dashboard';
import { colors, radius, spacing, tones } from '@/constants/theme';
import { getLightBand } from '@/utils/dashboard';

type Props = {
  level: number;
};

export function LightLevelCard({ level }: Props) {
  const band = getLightBand(level);
  const percent = Math.round((level / MAX_LIGHT_LEVEL) * 100);

  return (
    <Card
      title="Nivel de iluminación"
      icon="sunny-outline"
      right={<StatePill label={band.label} tone={band.tone} />}
    >
      <View style={styles.valueRow}>
        <Text style={styles.value}>{level}</Text>
        <Text style={styles.unit}>
          / {MAX_LIGHT_LEVEL} {LIGHT_UNIT}
        </Text>
      </View>

      <View>
        <View style={styles.track}>
          <View
            style={[
              styles.fill,
              { width: `${percent}%`, backgroundColor: tones[band.tone].fg },
            ]}
          />
        </View>
        <View style={styles.scale}>
          <Text style={styles.scaleLabel}>0</Text>
          <Text style={styles.scaleLabel}>{MAX_LIGHT_LEVEL / 2}</Text>
          <Text style={styles.scaleLabel}>{MAX_LIGHT_LEVEL}</Text>
        </View>
      </View>

      <View style={styles.note}>
        <Ionicons name="information-circle-outline" size={16} color={colors.info} />
        <Text style={styles.noteText}>
          Valor simulado en unidades relativas ({LIGHT_UNIT}). No es una medición real en lux.
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  value: { fontSize: 48, fontWeight: '700', color: colors.text },
  unit: { fontSize: 16, color: colors.textMuted },
  track: {
    height: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.neutralSoft,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radius.pill },
  scale: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  scaleLabel: { fontSize: 11, color: colors.textMuted },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.sm + 4,
    borderRadius: radius.md,
    backgroundColor: colors.infoSoft,
  },
  noteText: { flex: 1, fontSize: 12, lineHeight: 17, color: colors.info },
});