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
  lampOn: boolean;
  connection: ConnectionStatus;
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

export function RoomStatusSection({ occupied, lampOn, connection }: Props) {
  const connected = connection === 'connected';

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
          <StatePill
            label={lampOn ? 'Encendida' : 'Apagada'}
            tone={lampOn ? 'warning' : 'neutral'}
            icon={lampOn ? 'bulb' : 'bulb-outline'}
          />
        </StatusRow>
        <StatusRow icon="hardware-chip-outline" label="Dispositivo">
          <StatePill
            label={connected ? 'Conectado' : 'Desconectado'}
            tone={connected ? 'success' : 'error'}
            icon={connected ? 'wifi' : 'alert-circle-outline'}
          />
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