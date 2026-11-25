import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/dashboard/Card';
import { colors, radius, spacing, tones } from '@/constants/theme';
import type { LampCommandValue, LampState } from '@/types/control';
import type { IconName } from '@/types/ui';
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

type ActionProps = {
  label: string;
  icon: IconName;
  primary: boolean;
  disabled: boolean;
  loading: boolean;
  onPress: () => void;
};

function ActionButton({ label, icon, primary, disabled, loading, onPress }: ActionProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.action,
        primary ? styles.actionPrimary : styles.actionSecondary,
        (pressed || disabled) && styles.dimmed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <Ionicons name={icon} size={26} color={colors.text} />
      )}
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

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
              envías un comando, estarás anulando esa decisión de forma manual.
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

      <View style={styles.actions}>
        <ActionButton
          label="Encender luz"
          icon="bulb"
          primary
          disabled={busy}
          loading={false}
          onPress={() => onSend('on')}
        />
        <ActionButton
          label="Apagar luz"
          icon="bulb-outline"
          primary={false}
          disabled={busy}
          loading={false}
          onPress={() => onSend('off')}
        />
      </View>

      {isSending ? <Text style={styles.hint}>Enviando comando…</Text> : null}
      <Text style={styles.hint}>
        Los comandos quedan pendientes hasta que el dispositivo los ejecute. La conexión con el
        ESP32 llegará en una fase posterior.
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
  actions: { flexDirection: 'row', gap: spacing.sm + 4 },
  action: {
    flex: 1,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs + 2,
    borderRadius: radius.lg,
  },
  actionPrimary: { backgroundColor: colors.primary },
  actionSecondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
  dimmed: { opacity: 0.55 },
  hint: { fontSize: 12, lineHeight: 17, color: colors.textMuted },
});