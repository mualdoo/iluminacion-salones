import {
  ANALYTICS_PERIODS,
  PEAK_MIN_EVENTS,
  PEAK_WINDOW_HOURS,
  TIME_BANDS,
} from '@/constants/analytics';
import { COMMAND_TYPE_SET_LIGHT } from '@/constants/control';
import type {
  AnalyticsPeriod,
  DeviceStats,
  StatsInput,
  TimeBandKey,
} from '@/types/analytics';
import type { Measurement } from '@/types/database';

export const NO_PEAK_LABEL = 'Sin suficiente actividad';

const pad = (value: number) => String(value).padStart(2, '0');

export function getPeriodDurationMs(period: AnalyticsPeriod): number {
  return (ANALYTICS_PERIODS.find((p) => p.key === period) ?? ANALYTICS_PERIODS[0]).durationMs;
}

export function getPeriodLabel(period: AnalyticsPeriod): string {
  return (ANALYTICS_PERIODS.find((p) => p.key === period) ?? ANALYTICS_PERIODS[0]).label;
}

export function getTimeBandKey(hour: number): TimeBandKey {
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 19) return 'afternoon';
  return 'night';
}

export const formatPercent = (value: number | null): string =>
  value === null ? '—' : `${Math.round(value)} %`;

export const formatLevel = (value: number | null): string =>
  value === null ? '—' : String(Math.round(value));

export const formatPeakWindow = (peak: string | null): string => peak ?? NO_PEAK_LABEL;

const percent = (part: number, total: number): number | null =>
  total > 0 ? (part / total) * 100 : null;

function formatWindow(index: number): string {
  const start = index * PEAK_WINDOW_HOURS;
  return `${pad(start)}:00 - ${pad(start + PEAK_WINDOW_HOURS)}:00`;
}

type BandAccumulator = { lightSum: number; lightCount: number; detected: number; samples: number };
const emptyBand = (): BandAccumulator => ({ lightSum: 0, lightCount: 0, detected: 0, samples: 0 });

/** Función pura: calcula todas las métricas a partir de mediciones y comandos ya cargados. */
export function computeDeviceStats({
  measurements,
  commands,
  threshold,
  automaticMode,
}: StatsInput): DeviceStats {
  const bands: Record<TimeBandKey, BandAccumulator> = {
    morning: emptyBand(),
    afternoon: emptyBand(),
    night: emptyBand(),
  };
  const windows = new Array<number>(24 / PEAK_WINDOW_HOURS).fill(0);

  let lightCount = 0;
  let lightSum = 0;
  let lightMin = Infinity;
  let lightMax = -Infinity;
  let belowCount = 0;
  let motionSamples = 0;
  let motionDetected = 0;

  for (const m of measurements) {
    const date = new Date(m.recorded_at);
    if (Number.isNaN(date.getTime())) continue;

    const hour = date.getHours();
    const band = bands[getTimeBandKey(hour)];

    if (m.measurement_type === 'light') {
      lightCount += 1;
      lightSum += m.value;
      if (m.value < lightMin) lightMin = m.value;
      if (m.value > lightMax) lightMax = m.value;
      if (threshold !== null && m.value < threshold) belowCount += 1;
      band.lightCount += 1;
      band.lightSum += m.value;
    } else {
      motionSamples += 1;
      band.samples += 1;
      if (m.value === 1) {
        motionDetected += 1;
        band.detected += 1;
        windows[Math.floor(hour / PEAK_WINDOW_HOURS)] += 1;
      }
    }
  }

  let peakWindow: string | null = null;
  if (motionDetected >= PEAK_MIN_EVENTS) {
    let best = 0;
    for (let i = 1; i < windows.length; i++) {
      if (windows[i] > windows[best]) best = i;
    }
    peakWindow = formatWindow(best);
  }

  let turnedOn = 0;
  let turnedOff = 0;
  for (const c of commands) {
    if (c.command_type !== COMMAND_TYPE_SET_LIGHT || c.status !== 'executed') continue;
    if (c.value === 'on') turnedOn += 1;
    else if (c.value === 'off') turnedOff += 1;
  }

  const belowPct = threshold !== null ? percent(belowCount, lightCount) : null;

  return {
    totalReadings: lightCount + motionSamples,
    light: {
      count: lightCount,
      average: lightCount > 0 ? lightSum / lightCount : null,
      min: lightCount > 0 ? lightMin : null,
      max: lightCount > 0 ? lightMax : null,
      threshold,
      belowThresholdPct: belowPct,
      sufficientPct: belowPct === null ? null : 100 - belowPct,
    },
    motion: {
      samples: motionSamples,
      detected: motionDetected,
      presencePct: percent(motionDetected, motionSamples),
      peakWindow,
    },
    lamp: { turnedOn, turnedOff, total: turnedOn + turnedOff },
    bands: TIME_BANDS.map((band) => {
      const acc = bands[band.key];
      return {
        key: band.key,
        label: band.label,
        range: band.range,
        lightCount: acc.lightCount,
        lightAverage: acc.lightCount > 0 ? acc.lightSum / acc.lightCount : null,
        motionDetected: acc.detected,
        motionSamples: acc.samples,
      };
    }),
    automaticMode,
  };
}

/** Resumen compacto de las mediciones cargadas en el historial. */
export function summarizeMeasurements(items: Measurement[]): {
  count: number;
  lightCount: number;
  lightAverage: number | null;
} {
  let lightCount = 0;
  let lightSum = 0;
  for (const item of items) {
    if (item.measurement_type === 'light') {
      lightCount += 1;
      lightSum += item.value;
    }
  }
  return {
    count: items.length,
    lightCount,
    lightAverage: lightCount > 0 ? lightSum / lightCount : null,
  };
}