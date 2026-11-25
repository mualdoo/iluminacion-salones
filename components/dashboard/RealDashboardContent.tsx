import { StyleSheet, Text } from 'react-native';

import { AlertsSection } from '@/components/dashboard/AlertsSection';
import { Card } from '@/components/dashboard/Card';
import { LampCard } from '@/components/dashboard/LampCard';
import { LightChart } from '@/components/dashboard/LightChart';
import { LightLevelCard } from '@/components/dashboard/LightLevelCard';
import { MotionCard } from '@/components/dashboard/MotionCard';
import { RecentMeasurements } from '@/components/dashboard/RecentMeasurements';
import { RoomStatusSection } from '@/components/dashboard/RoomStatusSection';
import { colors } from '@/constants/theme';
import type { Command, Configuration, Device } from '@/types/database';
import type { RealDashboardData } from '@/types/measurements';
import type { IconName } from '@/types/ui';
import { analyzeRealDevice, describeLampSource } from '@/utils/deviceState';

type Props = {
  data: RealDashboardData;
  device: Device;
  configuration: Configuration | null;
  commands: Command[];
};

function NoDataCard({ title, icon, message }: { title: string; icon: IconName; message: string }) {
  return (
    <Card title={title} icon={icon}>
      <Text style={styles.text}>{message}</Text>
    </Card>
  );
}

export function RealDashboardContent({ data, device, configuration, commands }: Props) {
  const { occupied, lamp, alerts } = analyzeRealDevice({
    device,
    data,
    configuration,
    commands,
    now: Date.now(),
  });
  const isOccupied = occupied ?? false;

  const connection =
    device.status === 'online' ? 'connected' : device.status === 'offline' ? 'disconnected' : 'pending';
  const mode = configuration ? (configuration.automatic_mode ? 'automatic' : 'manual') : null;

  return (
    <>
      <AlertsSection alerts={alerts} />

      <RoomStatusSection
        occupied={isOccupied}
        lampOn={lamp.on}
        lampPending={lamp.pending}
        connection={connection}
      />

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
          occupied={isOccupied}
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

      <LampCard
        lampOn={lamp.on}
        mode={mode}
        simulated={false}
        pending={lamp.pending}
        sourceNote={describeLampSource(lamp)}
      />

      <LightChart samples={data.lightSamples} simulated={false} />
      <RecentMeasurements measurements={data.recent} alerts={alerts} />
    </>
  );
}

const styles = StyleSheet.create({
  text: { fontSize: 14, lineHeight: 20, color: colors.textMuted },
});