import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { ANALYTICS_MAX_ROWS } from '@/constants/analytics';
import { fetchAnalyticsData } from '@/services/analytics/analyticsService';
import type { AnalyticsPeriod, AnalyticsRawData } from '@/types/analytics';
import { getPeriodDurationMs } from '@/utils/analytics';

type State = {
  key: string | null;
  data: AnalyticsRawData | null;
  error: string | null;
};

/** Con deviceId null no consulta nada. Recarga al enfocar la pantalla y al cambiar dispositivo o periodo. */
export function useDeviceAnalytics(deviceId: string | null, period: AnalyticsPeriod) {
  const key = deviceId ? `${deviceId}|${period}` : null;
  const [state, setState] = useState<State>({ key: null, data: null, error: null });
  const requestId = useRef(0);

  // Lo guardado pertenece a otro dispositivo o periodo: se trata como "cargando" y sin datos.
  const isCurrent = key !== null && state.key === key;
  const data = isCurrent ? state.data : null;
  const error = isCurrent ? state.error : null;
  const isLoading = key !== null && !isCurrent;

  const refresh = useCallback(async () => {
    if (!deviceId || !key) return;
    const id = ++requestId.current;
    const now = Date.now();
    const periodStart = now - getPeriodDurationMs(period);

    const result = await fetchAnalyticsData(deviceId, new Date(periodStart).toISOString());
    if (id !== requestId.current) return;

    setState((prev) =>
      result.ok
        ? {
            key,
            data: {
              measurements: result.data.measurements,
              commands: result.data.commands,
              periodStart,
              fetchedAt: now,
              limitReached:
                result.data.measurements.length >= ANALYTICS_MAX_ROWS ||
                result.data.commands.length >= ANALYTICS_MAX_ROWS,
            },
            error: null,
          }
        : {
            key,
            data: prev.key === key ? prev.data : null,
            error: result.message,
          },
    );
  }, [deviceId, period, key]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return { data, isLoading, error, refresh };
}