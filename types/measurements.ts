import type { LightSample } from '@/types/dashboard';
import type { Measurement } from '@/types/database';

export type MeasurementTypeFilter = 'all' | 'light' | 'motion';
export type TimeRangeKey = 'hour' | 'day' | 'week' | 'all';
export type DataSource = 'real' | 'simulated';

export type RealDashboardData = {
  /** Muestras de iluminación en orden cronológico (de más antigua a más reciente). */
  lightSamples: LightSample[];
  latestLight: Measurement | null;
  latestMotion: Measurement | null;
  /** Marca de tiempo (ms) de la última lectura de movimiento con valor 1. */
  lastMotionDetectedAt: number | null;
  /** Últimas mediciones de todos los tipos, de más reciente a más antigua. */
  recent: Measurement[];
  hasData: boolean;
  fetchedAt: number;
};