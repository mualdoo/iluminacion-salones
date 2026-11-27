import type { MeasurementTypeFilter, TimeRangeKey } from '@/types/measurements';

export const HISTORY_PAGE_SIZE = 50;
export const DASHBOARD_LIGHT_SAMPLES = 12;
export const DASHBOARD_MOTION_SAMPLES = 5;
export const DASHBOARD_RECENT_COUNT = 6;
export const OCCUPANCY_WINDOW_SECONDS = 30;

export const TYPE_FILTERS: ReadonlyArray<{ key: MeasurementTypeFilter; label: string }> = [
  { key: 'all', label: 'Todos' },
  { key: 'light', label: 'Iluminación' },
  { key: 'motion', label: 'Movimiento' },
];

export const TIME_RANGES: ReadonlyArray<{
  key: TimeRangeKey;
  label: string;
  durationMs: number | null;
}> = [
  { key: 'hour', label: 'Última hora', durationMs: 60 * 60 * 1000 },
  { key: 'day', label: 'Últimas 24 horas', durationMs: 24 * 60 * 60 * 1000 },
  { key: 'week', label: 'Últimos 7 días', durationMs: 7 * 24 * 60 * 60 * 1000 },
  { key: 'all', label: 'Todo el historial', durationMs: null },
];