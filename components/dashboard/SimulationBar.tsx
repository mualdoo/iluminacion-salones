import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StatePill } from '@/components/dashboard/StatePill';
import { REFRESH_INTERVAL_MS } from '@/constants/dashboard';
import { colors, radius, spacing } from '@/constants/theme';
import { formatClock } from '@/utils/dashboard';

type Props = {
  updatedAt: number;
  onRefresh: () => void;
};

export function SimulationBar({ updatedAt, onRefresh }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <StatePill label="Datos simulados" tone="info" icon="flask-outline" />
        <Pressable
          onPress={onRefresh}
          accessibilityRole="button"
          accessibilityLabel="Actualizar datos simulados"
          style={({ pressed }) => [styles.refresh, pressed && styles.pressed]}
        >
          <Ionicons name="refresh" size={16} color={colors.text} />
          <Text style={styles.refreshLabel}>Actualizar</Text>
        </Pressable>
      </View>
      <Text style={styles.caption}>
        Última actualización: {formatClock(updatedAt)} · Se renueva cada{' '}
        {REFRESH_INTERVAL_MS / 1000} s
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  refresh: {
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
  pressed: { opacity: 0.6 },
  refreshLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  caption: { fontSize: 12, color: colors.textMuted },
});