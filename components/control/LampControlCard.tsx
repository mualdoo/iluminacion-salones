import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/dashboard/Card';
import { colors, radius, spacing, tones } from '@/constants/theme';
import type { LampCommandValue, LampState } from '@/types/control';

type Props = {
  lamp: LampState;
  /** null = sin configuración. */
  automaticMode: boolean | null;
  isSending: boolean;
  isSwitching: boolean;
  onSend: (value: LampCommandValue) => void;
  onSwitchToManual: () => void;
};

const TRACK_OFF_BORDER = '#B8C0CC';

export function LampControlCard({
  lamp,
  automaticMode,
  isSending,
  isSwitching,
  onSend,
  onSwitchToManual,
}: Props) {
  const tone = tones[lamp.on ? 'warning' : 'neutral'];
  const busy = isSending || isSwitching;
  const isOn = lamp.on === true;
  const stateLabel =
    lamp.on === null
      ? 'Sin datos'
      : `${lamp.on ? 'Encendida' : 'Apagada'}${lamp.pending ? ' (pendiente)' : ''}`;

  return (
    <Card title="Control de luz" icon="flash-outline">

      <Pressable
        onPress={() => onSend(isOn ? 'off' : 'on')}
        disabled={busy}
        accessibilityRole="switch"
        accessibilityLabel="Luz del salón"
        accessibilityState={{ checked: isOn, disabled: busy }}
        style={({ pressed }) => [
          styles.switchRow,
          { backgroundColor: tone.bg }, // <-- Color aplicado aquí
          (pressed || busy) && styles.dimmed,
        ]}
      >
      <View style={styles.main}>
        <Ionicons
          name={lamp.on ? 'bulb' : 'bulb-outline'}
          size={30}
          color={lamp.on ? colors.primary : tone.fg}
        />
        <View style={styles.texts}>
          <Text style={styles.state}>{stateLabel}</Text>
        </View>
      </View>
        
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  main: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  circle: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
  },
  texts: { flex: 1, gap: 2 },
  state: { fontSize: 18, fontWeight: '700', color: colors.text },
  source: { fontSize: 12, lineHeight: 17, color: colors.textMuted },
  notice: {
    gap: spacing.sm + 4,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.infoSoft,
  },
  noticeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  noticeText: { flex: 1, fontSize: 13, lineHeight: 18, color: colors.info },
  noticeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs + 2,
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  noticeButtonLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  switchTexts: { flex: 1, gap: 2 },
  switchLabel: { fontSize: 17, fontWeight: '700', color: colors.text },
  switchHint: { fontSize: 12, color: colors.textMuted },
  track: {
    width: 68,
    height: 38,
    justifyContent: 'center',
    padding: 3,
    borderRadius: radius.pill,
    borderWidth: 2,
  },
  trackOn: { backgroundColor: colors.primary, borderColor: colors.primary, alignItems: 'flex-end' },
  trackOff: { backgroundColor: '#FFFFFF', borderColor: TRACK_OFF_BORDER, alignItems: 'flex-start' },
  thumb: { width: 28, height: 28, borderRadius: 14 },
  thumbOn: { backgroundColor: '#FFFFFF' },
  thumbOff: { backgroundColor: TRACK_OFF_BORDER },
  dimmed: { opacity: 0.55 },
  hint: { fontSize: 12, lineHeight: 17, color: colors.textMuted },
});