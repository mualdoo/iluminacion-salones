import type { Command, Configuration, Measurement } from '@/types/database';

export type AnalyticsPeriod = 'day' | 'week' | 'month';
export type TimeBandKey = 'morning' | 'afternoon' | 'night';
export type RecommendationCategory = 'energy' | 'comfort' | 'automation' | 'maintenance';

export type AnalyticsRawData = {
  measurements: Measurement[];
  commands: Command[];
  periodStart: number;
  fetchedAt: number;
  limitReached: boolean;
};

export type StatsInput = {
  measurements: Measurement[];
  commands: Command[];
  threshold: number | null;
  automaticMode: boolean | null;
};

export type LightStats = {
  count: number;
  average: number | null;
  min: number | null;
  max: number | null;
  threshold: number | null;
  belowThresholdPct: number | null;
  sufficientPct: number | null;
};

export type MotionStats = {
  samples: number;
  detected: number;
  presencePct: number | null;
  /** Ej. "10:00 - 12:00"; null = sin suficiente actividad. */
  peakWindow: string | null;
};

export type LampStats = {
  turnedOn: number;
  turnedOff: number;
  total: number;
};

export type TimeBandStats = {
  key: TimeBandKey;
  label: string;
  range: string;
  lightCount: number;
  lightAverage: number | null;
  motionDetected: number;
  motionSamples: number;
};

export type DeviceStats = {
  totalReadings: number;
  light: LightStats;
  motion: MotionStats;
  lamp: LampStats;
  bands: TimeBandStats[];
  automaticMode: boolean | null;
};

export type Recommendation = {
  id: string;
  category: RecommendationCategory;
  title: string;
  explanation: string;
  action: string;
};

export type RecommendationInput = {
  stats: DeviceStats;
  configuration: Pick<Configuration, 'light_threshold' | 'automatic_mode'> | null;
};