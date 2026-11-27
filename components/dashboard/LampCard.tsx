import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/dashboard/Card';
import { StatePill } from '@/components/dashboard/StatePill';
import { colors, spacing, tones } from '@/constants/theme';
import type { OperationMode } from '@/types/dashboard';

type Props = {
  /** null = sin datos. */
  lampOn: boolean | null;
  /** null = sin configuración. */
  mode: OperationMode | null;
  pending?: boolean;
  /** Explica de dónde sale el estado (modo real). */
  sourceNote?: string | null;
};

export function LampCard({
  lampOn,
  mode,
  pending = false,
  sourceNote = null,
}: Props) {
  const tone = tones[lampOn ? 'warning' : 'neutral'];
  const stateLabel =
    lampOn === null
      ? 'Sin datos'
      : `${lampOn ? 'Encendida' : 'Apagada'}${pending ? ' (pendiente)' : ''}`;

  return (
    <Card title="Luz" icon="flash-outline">
      <View style={styles.main}>
        <View style={[styles.circle, { backgroundColor: tone.bg }]}>
          <Ionicons
            name={lampOn ? 'bulb' : 'bulb-outline'}
            size={32}
            color={lampOn ? colors.primary : tone.fg}
          />
        </View>
        <View style={styles.texts}>
          <Text style={styles.state}>{stateLabel}</Text>
        </View>
      </View>

      <View style={styles.modeRow}>
        <Text style={styles.modeLabel}>Modo de operación</Text>
        {mode === null ? (
          <StatePill label="Sin datos" tone="neutral" icon="help-circle-outline" />
        ) : (
          <StatePill
            label={mode === 'automatic' ? 'Automático' : 'Manual'}
            tone="info"
            icon={mode === 'automatic' ? 'sync-outline' : 'hand-left-outline'}
          />
        )}
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