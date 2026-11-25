import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/dashboard/Card';
import { StatePill } from '@/components/dashboard/StatePill';
import { MeasurementItem } from '@/components/measurements/MeasurementItem';
import { colors } from '@/constants/theme';
import type { Measurement } from '@/types/database';

type Props = {
  measurements: Measurement[];
};

export function RecentMeasurements({ measurements }: Props) {
  return (
    <Card
      title="Últimas mediciones"
      icon="pulse-outline"
      right={<StatePill label="Reales" tone="success" />}
    >
      {measurements.length === 0 ? (
        <Text style={styles.empty}>Sin mediciones por ahora.</Text>
      ) : (
        <View>
          {measurements.map((measurement, index) => (
            <View
              key={measurement.id}
              style={index < measurements.length - 1 ? styles.divider : undefined}
            >
              <MeasurementItem measurement={measurement} bordered={false} />
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  empty: { fontSize: 14, color: colors.textMuted },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
});