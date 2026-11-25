import { StyleSheet, Text } from 'react-native';

import { Card } from '@/components/dashboard/Card';
import { LightChart } from '@/components/dashboard/LightChart';
import { LightLevelCard } from '@/components/dashboard/LightLevelCard';
import { MotionCard } from '@/components/dashboard/MotionCard';
import { RecentMeasurements } from '@/components/dashboard/RecentMeasurements';
import { RoomStatusSection } from '@/components/dashboard/RoomStatusSection';
import { OCCUPANCY_WINDOW_MINUTES } from '@/constants/measurements';
import { colors } from '@/constants/theme';
import type { Device } from '@/types/database';
import type { RealDashboardData } from '@/types/measurements';
import type { IconName } from '@/types/ui';

type Props = {
  data: RealDashboardData;
  device: Device;
};

function NoDataCard({ title, icon, message }: { title: string; icon: IconName; message: string }) {
  return (
    <Card title={title} icon={icon}>
      <Text style={styles.text}>{message}</Text>
    </Card>
  );
}

export function RealDashboardContent({ data, device }: Props) {
  const connection =
    device.status === 'online' ? 'connected' : device.status === 'offline' ? 'disconnected' : 'pending';

  // Ocupado si hubo movimiento (valor 1) dentro de la ventana de ocupación.
  const occupied =
    data.lastMotionDetectedAt !== null &&
    data.fetchedAt - data.lastMotionDetectedAt <= OCCUPANCY_WINDOW_MINUTES * 60_000;

  return (
    <>
      <RoomStatusSection occupied={occupied} lampOn={null} connection={connection} />

      {data.latestLight ? (
        <LightLevelCard
          level={data.latestLight.value}
          simulated={false}
          measuredAt={new Date(data.latestLight.recorded_at).getTime()}
        />
      ) : (
        <NoDataCard
          title="Nivel de iluminación"
          icon="sunny-outline"
          message="Este dispositivo aún no tiene mediciones de iluminación."
        />
      )}

      {data.latestMotion ? (
        <MotionCard
          motionDetected={data.latestMotion.value === 1}
          occupied={occupied}
          simulated={false}
          lastReadingAt={new Date(data.latestMotion.recorded_at).getTime()}
        />
      ) : (
        <NoDataCard
          title="Detección de movimiento"
          icon="walk-outline"
          message="Este dispositivo aún no tiene lecturas del sensor de movimiento."
        />
      )}

      <NoDataCard
        title="Estado de la luminaria"
        icon="flash-outline"
        message="Aún no hay datos reales de la luminaria. Se mostrarán cuando se habilite el control del LED en una fase posterior."
      />

      <LightChart samples={data.lightSamples} simulated={false} />
      <RecentMeasurements measurements={data.recent} />
    </>
  );
}

const styles = StyleSheet.create({
  text: { fontSize: 14, lineHeight: 20, color: colors.textMuted },
});