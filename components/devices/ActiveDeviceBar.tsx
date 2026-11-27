import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/dashboard/Card';
import { colors, spacing, tones } from '@/constants/theme';
import type { Device } from '@/types/database';
import { DEVICE_STATUS_META } from '@/utils/devices';

type Props = {
  device: Device | null;
  onManage: () => void;
};

export function ActiveDeviceBar({ device, onManage }: Props) {
  const status = device ? DEVICE_STATUS_META[device.status] : null;

  return (
    <Pressable
      onPress={onManage}
      accessibilityRole="button"
      accessibilityLabel={
        device ? `Dispositivo activo: ${device.name}. Toca para cambiar` : 'Registrar dispositivo'
      }
      style={({ pressed }) => (pressed ? styles.pressed : undefined)}
    >
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={styles.iconCircle}>
            <Ionicons name="hardware-chip-outline" size={18} color={colors.textMuted} />
          </View>

          <View style={styles.texts}>
            <Text style={styles.label}>{device ? 'Dispositivo activo' : 'Toca para registrar uno'}</Text>
            <Text style={styles.name} numberOfLines={1}>
              {device ? device.name : 'Sin dispositivos'}
            </Text>
          </View>

          {device && status ? (
            <View accessible accessibilityLabel={status.label}>
              <Ionicons name={status.icon} size={22} color={tones[status.tone].fg} />
            </View>
          ) : (
            <Ionicons name="add-circle-outline" size={22} color={colors.textMuted} />
          )}
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.6 },
  card: { padding: spacing.sm + 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2 },
  iconCircle: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: colors.neutralSoft,
  },
  texts: { flex: 1 },
  label: { fontSize: 11, color: colors.textMuted },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
});