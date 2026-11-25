import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { StatePill } from '@/components/dashboard/StatePill';
import { colors, radius, spacing } from '@/constants/theme';
import { formatDateTime } from '@/utils/format';

type Props = {
  lastMeasurementAt: number | null;
  isRefreshing: boolean;
  onRefresh: () => void;
};

export function RealDataBar({ lastMeasurementAt, isRefreshing, onRefresh }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <StatePill label="Datos reales" tone="success" icon="cloud-done-outline" />
        <Pressable
          onPress={onRefresh}
          disabled={isRefreshing}
          accessibilityRole="button"
          accessibilityLabel="Actualizar datos reales"
          style={({ pressed }) => [styles.refresh, (pressed || isRefreshing) && styles.pressed]}
        >
          {isRefreshing ? (
            <ActivityIndicator size="small" color={colors.text} />
          ) : (
            <Ionicons name="refresh" size={16} color={colors.text} />
          )}
          <Text style={styles.refreshLabel}>Actualizar</Text>
        </Pressable>
      </View>
      <Text style={styles.caption}>
        {lastMeasurementAt
          ? `Última medición: ${formatDateTime(lastMeasurementAt)}`
          : 'Sin mediciones registradas'}
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