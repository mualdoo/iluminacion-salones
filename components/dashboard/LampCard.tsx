import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/dashboard/Card';
import { StatePill } from '@/components/dashboard/StatePill';
import { colors, spacing, tones } from '@/constants/theme';
import type { OperationMode } from '@/types/dashboard';

type Props = {
  lampOn: boolean;
  mode: OperationMode;
};

export function LampCard({ lampOn, mode }: Props) {
  const isAutomatic = mode === 'automatic';
  const tone = tones[lampOn ? 'warning' : 'neutral'];

  return (
    <Card title="Estado de la luminaria" icon="flash-outline">
      <View style={styles.main}>
        <View style={[styles.circle, { backgroundColor: tone.bg }]}>
          <Ionicons
            name={lampOn ? 'bulb' : 'bulb-outline'}
            size={32}
            color={lampOn ? colors.primary : tone.fg}
          />
        </View>
        <View style={styles.texts}>
          <Text style={styles.state}>{lampOn ? 'Luz encendida' : 'Luz apagada'}</Text>
          <Text style={styles.sub}>LED del salón (simulado)</Text>
        </View>
      </View>

      <View style={styles.modeRow}>
        <Text style={styles.modeLabel}>Modo de operación</Text>
        <StatePill
          label={isAutomatic ? 'Automático' : 'Manual'}
          tone="info"
          icon={isAutomatic ? 'sync-outline' : 'hand-left-outline'}
        />
      </View>
      <Text style={styles.hint}>Solo lectura: el control se habilitará en una fase posterior.</Text>
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
  sub: { fontSize: 13, color: colors.textMuted },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  modeLabel: { fontSize: 15, color: colors.text },
  hint: { fontSize: 12, lineHeight: 17, color: colors.textMuted },
});