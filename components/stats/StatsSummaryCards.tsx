import { StyleSheet, Text } from 'react-native';

import { Card } from '@/components/dashboard/Card';
import { StatGrid, StatTile } from '@/components/stats/StatTile';
import { LIGHT_UNIT } from '@/constants/dashboard';
import { colors } from '@/constants/theme';
import type { LampStats, LightStats, MotionStats } from '@/types/analytics';
import { formatLevel, formatPeakWindow, formatPercent } from '@/utils/analytics';

export function LightStatsCard({ light }: { light: LightStats }) {
  return (
    <Card title="Iluminación" icon="sunny-outline">
      {light.count === 0 ? (
        <Text style={styles.text}>No hay lecturas de iluminación en este periodo.</Text>
      ) : (
        <>
          <StatGrid>
            <StatTile label="Promedio" value={formatLevel(light.average)} hint={LIGHT_UNIT} />
            <StatTile label="Lecturas" value={String(light.count)} />
            <StatTile label="Mínimo" value={formatLevel(light.min)} hint={LIGHT_UNIT} />
            <StatTile label="Máximo" value={formatLevel(light.max)} hint={LIGHT_UNIT} />
            <StatTile
              label="Bajo el umbral"
              value={formatPercent(light.belowThresholdPct)}
              hint={light.threshold !== null ? `umbral: ${Math.round(light.threshold)} ${LIGHT_UNIT}` : 'sin umbral'}
            />
            <StatTile label="Luz suficiente" value={formatPercent(light.sufficientPct)} hint="lecturas ≥ umbral" />
          </StatGrid>
          <Text style={styles.text}>
            Valores en unidades relativas ({LIGHT_UNIT}), no en lux.
          </Text>
        </>
      )}
    </Card>
  );
}

export function OccupancyStatsCard({ motion }: { motion: MotionStats }) {
  return (
    <Card title="Ocupación" icon="people-outline">
      {motion.samples === 0 ? (
        <Text style={styles.text}>No hay lecturas de movimiento en este periodo.</Text>
      ) : (
        <>
          <StatGrid>
            <StatTile label="Movimientos detectados" value={String(motion.detected)} hint="eventos (valor 1)" />
            <StatTile label="Muestras" value={String(motion.samples)} />
            <StatTile label="Presencia estimada" value={formatPercent(motion.presencePct)} hint="muestras con movimiento" />
            <StatTile label="Franja pico" value={formatPeakWindow(motion.peakWindow)} />
          </StatGrid>
          <Text style={styles.text}>
            La presencia es la proporción de muestras con movimiento. La franja pico requiere al
            menos 3 eventos.
          </Text>
        </>
      )}
    </Card>
  );
}

type LampProps = {
  lamp: LampStats;
  light: LightStats;
  automaticMode: boolean | null;
};

export function LampUsageCard({ lamp, light, automaticMode }: LampProps) {
  const mode =
    automaticMode === null ? 'Sin datos' : automaticMode ? 'Automático' : 'Manual';

  return (
    <Card title="Uso de la luminaria" icon="bulb-outline">
      <StatGrid>
        <StatTile label="Encendidos" value={String(lamp.turnedOn)} hint="comandos ejecutados" />
        <StatTile label="Apagados" value={String(lamp.turnedOff)} hint="comandos ejecutados" />
        <StatTile label="Iluminación suficiente" value={formatPercent(light.sufficientPct)} hint="lecturas ≥ umbral" />
        <StatTile label="Modo actual" value={mode} />
      </StatGrid>
      <Text style={styles.text}>
        Solo se cuentan comandos marcados como ejecutados por el dispositivo. La app guarda el
        modo actual, no un historial de modos.
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  text: { fontSize: 12, lineHeight: 17, color: colors.textMuted },
});