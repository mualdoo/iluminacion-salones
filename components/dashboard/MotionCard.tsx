import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/dashboard/Card';
import { StatePill } from '@/components/dashboard/StatePill';
import { OCCUPANCY_WINDOW_SECONDS } from '@/constants/measurements';
import { colors, spacing, tones } from '@/constants/theme';
import { formatDateTime } from '@/utils/format';

type Props = {
  motionDetected: boolean;
  occupied: boolean;
  simulated?: boolean;
  /** Marca de tiempo (ms) de la última lectura real. */
  lastReadingAt?: number | null;
};

export function MotionCard({ motionDetected, occupied, simulated = true, lastReadingAt = null }: Props) {
  const tone = tones[motionDetected ? 'info' : 'neutral'];

  return (
    <Card title="Detección de movimiento" icon="walk-outline">
      <View style={styles.main}>
        <View style={[styles.circle, { backgroundColor: tone.bg }]}>
          <Ionicons name={motionDetected ? 'walk' : 'walk-outline'} size={32} color={tone.fg} />
        </View>
        <View style={styles.texts}>
          <Text style={styles.state}>
            {motionDetected ? 'Movimiento detectado' : 'Sin movimiento'}
          </Text>
          <Text style={styles.sensor}>{simulated ? 'Sensor PIR (simulado)' : 'Sensor PIR'}</Text>
          {!simulated && lastReadingAt ? (
            <Text style={styles.sensor}>Última lectura: {formatDateTime(lastReadingAt)}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.occupancyRow}>
        <Text style={styles.occupancyLabel}>Ocupación estimada</Text>
        <StatePill
          label={occupied ? 'Ocupado' : 'Desocupado'}
          tone={occupied ? 'info' : 'neutral'}
        />
      </View>
      <Text style={styles.hint}>
        {simulated
          ? 'Se estima ocupado mientras haya movimiento reciente en el salón.'
          : `Se estima ocupado si se detectó movimiento en los últimos ${OCCUPANCY_WINDOW_SECONDS} segundos.`}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  main: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  circle: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 32,
  },
  texts: { flex: 1, gap: 2 },
  state: { fontSize: 18, fontWeight: '700', color: colors.text },
  sensor: { fontSize: 13, color: colors.textMuted },
  occupancyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  occupancyLabel: { fontSize: 15, color: colors.text },
  hint: { fontSize: 12, lineHeight: 17, color: colors.textMuted },
});