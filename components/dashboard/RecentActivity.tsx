import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/dashboard/Card';
import { StatePill } from '@/components/dashboard/StatePill';
import { colors, spacing, tones, type Tone } from '@/constants/theme';
import type { ActivityEvent, ActivityEventType } from '@/types/dashboard';
import type { IconName } from '@/types/ui';
import { formatClock } from '@/utils/dashboard';

const EVENT_STYLE: Record<ActivityEventType, { icon: IconName; tone: Tone }> = {
  motion_detected: { icon: 'walk', tone: 'info' },
  room_vacated: { icon: 'exit-outline', tone: 'neutral' },
  light_on: { icon: 'bulb', tone: 'warning' },
  light_off: { icon: 'bulb-outline', tone: 'neutral' },
  device_connected: { icon: 'wifi', tone: 'success' },
  device_disconnected: { icon: 'alert-circle-outline', tone: 'error' },
  mode_automatic: { icon: 'sync-outline', tone: 'info' },
  mode_manual: { icon: 'hand-left-outline', tone: 'info' },
};

type Props = {
  events: ActivityEvent[];
};

export function RecentActivity({ events }: Props) {
  return (
    <Card
      title="Actividad reciente"
      icon="list-outline"
      right={<StatePill label="Simulada" tone="neutral" />}
    >
      {events.length === 0 ? (
        <Text style={styles.empty}>Sin eventos por ahora.</Text>
      ) : (
        <View>
          {events.map((event, index) => {
            const style = EVENT_STYLE[event.type];
            const palette = tones[style.tone];
            return (
              <View
                key={event.id}
                style={[styles.row, index < events.length - 1 && styles.divider]}
              >
                <View style={[styles.iconCircle, { backgroundColor: palette.bg }]}>
                  <Ionicons name={style.icon} size={18} color={palette.fg} />
                </View>
                <Text style={styles.description}>{event.description}</Text>
                <Text style={styles.time}>{formatClock(event.timestamp)}</Text>
              </View>
            );
          })}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  empty: { fontSize: 14, color: colors.textMuted },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
    paddingVertical: spacing.sm + 2,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconCircle: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  description: { flex: 1, fontSize: 15, color: colors.text },
  time: { fontSize: 12, color: colors.textMuted },
});