import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/dashboard/Card';
import { StatePill } from '@/components/dashboard/StatePill';
import { colors, radius, spacing } from '@/constants/theme';
import type { Device } from '@/types/database';
import { DEVICE_STATUS_META } from '@/utils/devices';
import { formatLastSeen } from '@/utils/format';

type Props = {
  device: Device | null;
  onManage: () => void;
};

export function ActiveDeviceBar({ device, onManage }: Props) {
  const status = device ? DEVICE_STATUS_META[device.status] : null;

  return (
    <Card>
      <View style={styles.row}>
        <View style={styles.iconCircle}>
          <Ionicons name="hardware-chip-outline" size={22} color={colors.textMuted} />
        </View>

        <View style={styles.texts}>
          <Text style={styles.label}>Dispositivo activo</Text>
          {device ? (
            <>
              <Text style={styles.name} numberOfLines={1}>
                {device.name}
              </Text>
              {status ? <StatePill label={status.label} tone={status.tone} icon={status.icon} /> : null}
              <Text style={styles.lastSeen}>{formatLastSeen(device.last_seen_at)}</Text>
            </>
          ) : (
            <>
              <Text style={styles.name}>Sin dispositivos</Text>
              <Text style={styles.lastSeen}>Registra un salón para ver sus mediciones reales.</Text>
            </>
          )}
        </View>

        <Pressable
          onPress={onManage}
          accessibilityRole="button"
          accessibilityLabel={device ? 'Cambiar dispositivo' : 'Registrar dispositivo'}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        >
          <Text style={styles.actionLabel}>{device ? 'Cambiar' : 'Registrar'}</Text>
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 4 },
  iconCircle: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.neutralSoft,
  },
  texts: { flex: 1, gap: spacing.xs },
  label: { fontSize: 12, color: colors.textMuted },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  lastSeen: { fontSize: 12, color: colors.textMuted },
  action: {
    height: 36,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pressed: { opacity: 0.6 },
  actionLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
});