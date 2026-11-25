import type { AnalyticsPeriod, TimeBandKey } from '@/types/analytics';

const DAY_MS = 24 * 60 * 60 * 1000;

export const ANALYTICS_PERIODS: ReadonlyArray<{
  key: AnalyticsPeriod;
  label: string;
  durationMs: number;
}> = [
  { key: 'day', label: 'Últimas 24 horas', durationMs: DAY_MS },
  { key: 'week', label: 'Últimos 7 días', durationMs: 7 * DAY_MS },
  { key: 'month', label: 'Últimos 30 días', durationMs: 30 * DAY_MS },
];

export const TIME_BANDS: ReadonlyArray<{ key: TimeBandKey; label: string; range: string }> = [
  { key: 'morning', label: 'Mañana', range: '06:00 – 12:00' },
  { key: 'afternoon', label: 'Tarde', range: '12:00 – 19:00' },
  { key: 'night', label: 'Noche', range: '19:00 – 06:00' },
];

export const ANALYTICS_MAX_ROWS = 1000;

export const EXPORT_MAX_ROWS = 5000;
export const EXPORT_PAGE_SIZE = 1000;

// Reglas de ocupación y recomendaciones
export const PEAK_WINDOW_HOURS = 2;
export const PEAK_MIN_EVENTS = 3;
export const MIN_READINGS_FOR_ANALYSIS = 5;
export const BELOW_THRESHOLD_ALERT_PCT = 70;
export const HIGH_AVERAGE_LIGHT = 750;
export const HIGH_AVERAGE_RATIO = 1.5;
export const LOW_PRESENCE_PCT = 30;
export const FREQUENT_MANUAL_ON = 3;
export const MANY_MANUAL_COMMANDS = 6;
export const MAX_RECOMMENDATIONS = 4;