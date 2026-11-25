import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { HISTORY_PAGE_SIZE } from '@/constants/measurements';
import { fetchMeasurements } from '@/services/measurements/measurementService';
import type { Measurement } from '@/types/database';
import type { MeasurementTypeFilter, TimeRangeKey } from '@/types/measurements';
import { getRangeStart } from '@/utils/measurements';

type State = {
  key: string | null;
  items: Measurement[];
  hasMore: boolean;
  error: string | null;
};

export function useMeasurements(
  deviceId: string | null,
  type: MeasurementTypeFilter,
  range: TimeRangeKey,
) {
  const key = deviceId ? `${deviceId}|${type}|${range}` : null;

  const [state, setState] = useState<State>({ key: null, items: [], hasMore: false, error: null });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const requestId = useRef(0);
  const sinceRef = useRef<string | null>(null);

  // Si el estado pertenece a otra combinación de filtros, se considera "cargando" y sin datos.
  const isCurrent = key !== null && state.key === key;
  const items = isCurrent ? state.items : [];
  const hasMore = isCurrent ? state.hasMore : false;
  const error = isCurrent ? state.error : null;
  const isLoading = key !== null && !isCurrent;

  const load = useCallback(
    async (pull = false) => {
      if (!deviceId || !key) return;
      const id = ++requestId.current;
      if (pull) setIsRefreshing(true);

      const since = getRangeStart(range);
      const result = await fetchMeasurements({
        deviceId,
        type,
        since,
        offset: 0,
        limit: HISTORY_PAGE_SIZE,
      });

      if (pull) setIsRefreshing(false);
      if (id !== requestId.current) return; // llegó una petición más nueva

      if (result.ok) {
        sinceRef.current = since;
        setState({
          key,
          items: result.data,
          hasMore: result.data.length === HISTORY_PAGE_SIZE,
          error: null,
        });
      } else {
        setState((prev) => ({
          key,
          items: prev.key === key ? prev.items : [],
          hasMore: prev.key === key ? prev.hasMore : false,
          error: result.message,
        }));
      }
    },
    [deviceId, type, range, key],
  );

  // Carga al enfocar la pestaña y cada vez que cambian dispositivo o filtros.
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const loadMore = useCallback(async () => {
    if (!deviceId || !key || !isCurrent || !hasMore || isLoadingMore) return;
    const id = requestId.current;
    setIsLoadingMore(true);

    const result = await fetchMeasurements({
      deviceId,
      type,
      since: sinceRef.current,
      offset: items.length,
      limit: HISTORY_PAGE_SIZE,
    });

    setIsLoadingMore(false);
    if (id !== requestId.current) return;

    if (result.ok) {
      setState((prev) => {
        if (prev.key !== key) return prev;
        const known = new Set(prev.items.map((item) => item.id));
        const extra = result.data.filter((item) => !known.has(item.id));
        return {
          ...prev,
          items: [...prev.items, ...extra],
          hasMore: result.data.length === HISTORY_PAGE_SIZE,
        };
      });
    } else {
      setState((prev) => (prev.key === key ? { ...prev, error: result.message } : prev));
    }
  }, [deviceId, key, isCurrent, hasMore, isLoadingMore, type, items.length]);

  const refresh = useCallback(() => load(true), [load]);

  return { items, isLoading, isRefreshing, isLoadingMore, hasMore, error, refresh, loadMore };
}