import { LIGHT_UNIT } from '@/constants/dashboard';
import { TIME_RANGES } from '@/constants/measurements';
import type { Tone } from '@/constants/theme';
import type { Measurement, MeasurementType } from '@/types/database';
import type { TimeRangeKey } from '@/types/measurements';
import type { IconName } from '@/types/ui';

/** Inicio del rango como fecha ISO (UTC), o null si es "todo el historial". */
export function getRangeStart(range: TimeRangeKey, now: number = Date.now()): string | null {
  const option = TIME_RANGES.find((item) => item.key === range);
  if (!option || option.durationMs === null) return null;
  return new Date(now - option.durationMs).toISOString();
}

export const MEASUREMENT_META: Record<
  MeasurementType,
  { label: string; icon: IconName; tone: Tone }
> = {
  light: { label: 'Iluminación', icon: 'sunny-outline', tone: 'warning' },
  motion: { label: 'Movimiento', icon: 'walk-outline', tone: 'info' },
};

export function formatMeasurementValue(
  measurement: Pick<Measurement, 'measurement_type' | 'value'>,
): string {
  if (measurement.measurement_type === 'motion') {
    return measurement.value === 1 ? 'Movimiento detectado' : 'Sin movimiento';
  }
  return `${Math.round(measurement.value * 10) / 10} ${LIGHT_UNIT}`;
}