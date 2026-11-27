import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/dashboard/Card';
import { colors, spacing, tones } from '@/constants/theme';
import type { DeviceAlert } from '@/types/alerts';
import { ALERT_SEVERITY_META } from '@/utils/alerts';
import { formatClock } from '@/utils/dashboard';

type Props = {
  alerts: DeviceAlert[];
  /** Si es true, con cero alertas muestra "Sin alertas activas" en lugar de ocultarse. */
  showWhenEmpty?: boolean;
};

export function AlertsSection({ alerts, showWhenEmpty = false }: Props) {
  if (alerts.length === 0) {
    if (!showWhenEmpty) return null;
    return (
      <Card title="Alertas" icon="notifications-outline">
        <View style={styles.okRow}>
          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          <Text style={styles.okText}>Sin alertas.</Text>
        </View>
      </Card>
    );
  }

  return (
    <Card
      title="Alertas"
      icon="notifications-outline"
    >
      <View>
        {alerts.map((alert, index) => {
          const meta = ALERT_SEVERITY_META[alert.severity];
          const palette = tones[meta.tone];
          return (
            <View
              key={alert.id}
              style={[styles.row, index < alerts.length - 1 && styles.divider]}
            >
              <View style={[styles.iconCircle, { backgroundColor: palette.bg }]}>
                <Ionicons name={meta.icon} size={20} color={palette.fg} />
              </View>
              <View style={styles.texts}>
                <View style={styles.titleRow}>
                  <Text style={styles.title}>{alert.title}</Text>
                </View>
                <Text style={styles.time}>{formatClock(alert.timestamp)}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  okRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  okText: { fontSize: 14, color: colors.textMuted },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm + 4,
    paddingVertical: spacing.sm + 2,
  },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  iconCircle: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  texts: { flex: 1, gap: spacing.xs + 2 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
  time: { fontSize: 12, color: colors.textMuted },
  description: { fontSize: 13, lineHeight: 18, color: colors.textMuted },
});