import type { MeasurementTypeFilter, TimeRangeKey } from '@/types/measurements';

export type ValueFilter = 'all' | 'below' | 'above' | 'detected' | 'none';
export type SortOrder = 'desc' | 'asc';

export type MeasurementFilters = {
  type: MeasurementTypeFilter;
  range: TimeRangeKey;
  valueFilter: ValueFilter;
  sort: SortOrder;
  /** light_threshold del dispositivo, o null si no se conoce. */
  threshold: number | null;
};