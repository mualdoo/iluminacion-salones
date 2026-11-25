import { StyleSheet, Text, View } from 'react-native';

import { AlertActivityRow } from '@/components/dashboard/AlertActivityRow';
import { Card } from '@/components/dashboard/Card';
import { StatePill } from '@/components/dashboard/StatePill';
import { MeasurementItem } from '@/components/measurements/MeasurementItem';
import { colors } from '@/constants/theme';
import type { DeviceAlert } from '@/types/alerts';
import type { Measurement } from '@/types/database';

const MAX_ALERT_ROWS = 3;

type Props = {
  measurements: Measurement[];
  alerts?: DeviceAlert[];
};

export function RecentMeasurements({ measurements, alerts = [] }: Props) {
  const alertRows = alerts.slice(0, MAX_ALERT_ROWS);
  const total = alertRows.length + measurements.length;

  return (
    <Card
      title="Últimas mediciones"
      icon="pulse-outline"
      right={<StatePill label="Reales" tone="success" />}
    >
      {total === 0 ? (
        <Text style={styles.empty}>Sin mediciones por ahora.</Text>
      ) : (
        <View>
          {alertRows.map((alert, index) => (
            <AlertActivityRow key={`alert-${alert.id}`} alert={alert} divider={index < total - 1} />
          ))}
          {measurements.map((measurement, index) => {
            const rowIndex = alertRows.length + index;
            return (
              <View key={measurement.id} style={rowIndex < total - 1 ? styles.divider : undefined}>
                <MeasurementItem measurement={measurement} bordered={false} />
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
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
});