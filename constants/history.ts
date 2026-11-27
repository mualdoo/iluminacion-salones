import type { SortOrder, ValueFilter } from '@/types/history';

type Option<T extends string> = { key: T; label: string };

export const LIGHT_VALUE_FILTERS: ReadonlyArray<Option<ValueFilter>> = [
  { key: 'all', label: 'Todos' },
  { key: 'below', label: 'Bajo umbral' },
  { key: 'above', label: 'Sobre umbral' },
];

export const MOTION_VALUE_FILTERS: ReadonlyArray<Option<ValueFilter>> = [
  { key: 'all', label: 'Todos' },
  { key: 'detected', label: 'Solo detectado (1)' },
  { key: 'none', label: 'Sin movimiento (0)' },
];

export const SORT_OPTIONS: ReadonlyArray<Option<SortOrder>> = [
  { key: 'desc', label: 'Más recientes' },
  { key: 'asc', label: 'Más antiguos' },
];