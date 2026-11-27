import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/dashboard/Card';
import { colors, radius, spacing, tones } from '@/constants/theme';
import type { LampCommandValue, LampState } from '@/types/control';
import { describeLampSource } from '@/utils/deviceState';

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
      : `${lamp.on ? 'Luz encendida' : 'Luz apagada'}${lamp.pending ? ' (pendiente)' : ''}`;

  return (
    <Card title="Control de luminaria" icon="bulb-outline">
      <View style={styles.main}>
        <View style={[styles.circle, { backgroundColor: tone.bg }]}>
          <Ionicons
            name={lamp.on ? 'bulb' : 'bulb-outline'}
            size={30}
            color={lamp.on ? colors.primary : tone.fg}
          />
        </View>
        <View style={styles.texts}>
          <Text style={styles.state}>{stateLabel}</Text>
          <Text style={styles.source}>{describeLampSource(lamp)}</Text>
        </View>
      </View>

      {automaticMode ? (
        <View style={styles.notice}>
          <View style={styles.noticeRow}>
            <Ionicons name="sync-outline" size={18} color={colors.info} />
            <Text style={styles.noticeText}>
              El dispositivo está en modo automático y decide según el umbral y la presencia. Si
              cambias la luz, estarás anulando esa decisión de forma manual.
            </Text>
          </View>
          <Pressable
            onPress={onSwitchToManual}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="Cambiar a modo manual"
            style={({ pressed }) => [styles.noticeButton, (pressed || busy) && styles.dimmed]}
          >
            {isSwitching ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <Ionicons name="hand-left-outline" size={16} color={colors.text} />
            )}
            <Text style={styles.noticeButtonLabel}>Cambiar a modo manual</Text>
          </Pressable>
        </View>
      ) : null}

      <Pressable
        onPress={() => onSend(isOn ? 'off' : 'on')}
        disabled={busy}
        accessibilityRole="switch"
        accessibilityLabel="Luz del salón"
        accessibilityState={{ checked: isOn, disabled: busy }}
        style={({ pressed }) => [styles.switchRow, (pressed || busy) && styles.dimmed]}
      >
        <View style={styles.switchTexts}>
          <Text style={styles.switchLabel}>{isOn ? 'Encendida' : 'Apagada'}</Text>
          <Text style={styles.switchHint}>
            {isSending ? 'Enviando comando…' : 'Toca para cambiar el estado de la luz'}
          </Text>
        </View>
        <View style={[styles.track, isOn ? styles.trackOn : styles.trackOff]}>
          <View style={[styles.thumb, isOn ? styles.thumbOn : styles.thumbOff]} />
        </View>
      </Pressable>

      <Text style={styles.hint}>
        Los comandos quedan pendientes hasta que el dispositivo los ejecute.
      </Text>
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