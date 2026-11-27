import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/dashboard/Card';
import { colors, spacing, tones } from '@/constants/theme';
import { formatDateTime } from '@/utils/format';

type Props = {
  motionDetected: boolean;
  occupied: boolean;
  /** Marca de tiempo (ms) de la última lectura real. */
  lastReadingAt?: number | null;
};

export function MotionCard({ motionDetected, occupied, lastReadingAt = null }: Props) {
  const tone = tones[occupied ? 'info' : 'neutral'];

  return (
    <Card title="Movimiento" icon="walk-outline">
      <View style={styles.main}>
        <View style={[styles.circle, { backgroundColor: tone.bg }]}>
          <Ionicons name={occupied ? 'walk' : 'walk-outline'} size={32} color={tone.fg} />
        </View>
        <View style={styles.texts}>
          <Text style={styles.state}>
            {occupied ? 'Ocupado' : 'Desocupado'}
          </Text>
          {lastReadingAt ? (
            <Text style={styles.sensor}>Última lectura: {formatDateTime(lastReadingAt)}</Text>
          ) : null}
        </View>
      </View>
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