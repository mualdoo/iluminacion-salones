import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/dashboard/Card';
import { StatePill } from '@/components/dashboard/StatePill';
import { colors, spacing } from '@/constants/theme';
import type { ConnectionStatus } from '@/types/dashboard';
import type { IconName } from '@/types/ui';

type Props = {
  occupied: boolean;
  /** null = sin dato (aún no hay información real de la luminaria). */
  lampOn: boolean | null;
  /** 'pending' = dispositivo registrado que todavía no se ha conectado. */
  connection: ConnectionStatus | 'pending';
};

function StatusRow({ icon, label, children }: { icon: IconName; label: string; children: ReactNode }) {
  return (
    <View style={styles.row}>
      <View style={styles.labelGroup}>
        <View style={styles.iconCircle}>
          <Ionicons name={icon} size={18} color={colors.textMuted} />
        </View>
        <Text style={styles.label}>{label}</Text>
      </View>
      {children}
    </View>
  );
}

function LampPill({ lampOn }: { lampOn: boolean | null }) {
  if (lampOn === null) {
    return <StatePill label="Sin datos" tone="neutral" icon="help-circle-outline" />;
  }
  return (
    <StatePill
      label={lampOn ? 'Encendida' : 'Apagada'}
      tone={lampOn ? 'warning' : 'neutral'}
      icon={lampOn ? 'bulb' : 'bulb-outline'}
    />
  );
}

function ConnectionPill({ connection }: { connection: Props['connection'] }) {
  if (connection === 'connected') {
    return <StatePill label="Conectado" tone="success" icon="wifi" />;
  }
  if (connection === 'pending') {
    return <StatePill label="Pendiente" tone="warning" icon="time-outline" />;
  }
  return <StatePill label="Desconectado" tone="error" icon="alert-circle-outline" />;
}

export function RoomStatusSection({ occupied, lampOn, connection }: Props) {
  return (
    <Card title="Estado del salón" icon="home-outline">
      <View style={styles.list}>
        <StatusRow icon="people-outline" label="Ocupación">
          <StatePill
            label={occupied ? 'Ocupado' : 'Desocupado'}
            tone={occupied ? 'info' : 'neutral'}
            icon={occupied ? 'people' : 'people-outline'}
          />
        </StatusRow>
        <StatusRow icon="bulb-outline" label="Iluminación">
          <LampPill lampOn={lampOn} />
        </StatusRow>
        <StatusRow icon="hardware-chip-outline" label="Dispositivo">
          <ConnectionPill connection={connection} />
        </StatusRow>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  labelGroup: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
  },
  iconCircle: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: colors.neutralSoft,
  },
  label: { flexShrink: 1, fontSize: 15, color: colors.text },
});