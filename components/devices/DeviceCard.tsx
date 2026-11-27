import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/dashboard/Card';
import { StatePill } from '@/components/dashboard/StatePill';
import { colors, radius, spacing } from '@/constants/theme';
import type { Device } from '@/types/database';
import { DEVICE_STATUS_META } from '@/utils/devices';
import { formatDateTime } from '@/utils/format';

type Props = {
  device: Device;
  isActive: boolean;
  isBusy: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onShowCredentials: () => void;
};

export function DeviceCard({
  device,
  isActive,
  isBusy,
  onSelect,
  onEdit,
  onDelete,
  onShowCredentials,
}: Props) {
  const status = DEVICE_STATUS_META[device.status];

  return (
    <Pressable
      onPress={onSelect}
      accessibilityRole="button"
      accessibilityLabel={`Seleccionar ${device.name} como dispositivo activo`}
      accessibilityState={{ selected: isActive }}
      style={({ pressed }) => (pressed ? styles.pressed : undefined)}
    >
      <Card style={isActive ? styles.activeCard : undefined}>
        <View style={styles.topRow}>
          <View style={styles.iconCircle}>
            <Ionicons name="school-outline" size={22} color={colors.textMuted} />
          </View>
          <View style={styles.texts}>
            <Text style={styles.name}>{device.name}</Text>
            {device.description ? <Text style={styles.description}>{device.description}</Text> : null}
          </View>
          {isActive ? <StatePill label="Activo" tone="success" icon="checkmark-circle" /> : null}
        </View>

        <View style={styles.statusRow}>
          <StatePill label={status.label} tone={status.tone} icon={status.icon} />
          <Text style={styles.lastSeen}>
            {device.last_seen_at
              ? `Última conexión: ${formatDateTime(device.last_seen_at)}`
              : 'Sin conexión registrada'}
          </Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={onShowCredentials}
            disabled={isBusy}
            accessibilityRole="button"
            accessibilityLabel={`Ver credenciales ESP32 de ${device.name}`}
            style={({ pressed }) => [styles.action, (pressed || isBusy) && styles.pressed]}
          >
            <Ionicons name="key-outline" size={16} color={colors.text} />
            <Text style={styles.actionLabel}>Credenciales ESP32</Text>
          </Pressable>
          <Pressable
            onPress={onEdit}
            disabled={isBusy}
            accessibilityRole="button"
            accessibilityLabel={`Editar ${device.name}`}
            style={({ pressed }) => [styles.action, (pressed || isBusy) && styles.pressed]}
          >
            <Ionicons name="create-outline" size={16} color={colors.text} />
            <Text style={styles.actionLabel}>Editar</Text>
          </Pressable>
          <Pressable
            onPress={onDelete}
            disabled={isBusy}
            accessibilityRole="button"
            accessibilityLabel={`Eliminar ${device.name}`}
            style={({ pressed }) => [styles.action, (pressed || isBusy) && styles.pressed]}
          >
            <Ionicons name="trash-outline" size={16} color={colors.error} />
            <Text style={[styles.actionLabel, { color: colors.error }]}>Eliminar</Text>
          </Pressable>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.6 },
  activeCard: { borderWidth: 2, borderColor: colors.primary },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 4 },
  iconCircle: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.neutralSoft,
  },
  texts: { flex: 1, gap: 2 },
  name: { fontSize: 17, fontWeight: '700', color: colors.text },
  description: { fontSize: 13, lineHeight: 18, color: colors.textMuted },
  statusRow: { gap: spacing.sm },
  lastSeen: { fontSize: 12, color: colors.textMuted },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  actionLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
});