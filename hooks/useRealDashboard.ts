import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { fetchDashboardMeasurements } from '@/services/measurements/measurementService';
import type { RealDashboardData } from '@/types/measurements';

type State = {
  deviceId: string | null;
  data: RealDashboardData | null;
  error: string | null;
};

export function useRealDashboard(deviceId: string | null) {
  const [state, setState] = useState<State>({ deviceId: null, data: null, error: null });
  const requestId = useRef(0);

  // Lo guardado pertenece a otro dispositivo: se trata como "cargando" y sin datos.
  const isCurrent = deviceId !== null && state.deviceId === deviceId;
  const data = isCurrent ? state.data : null;
  const error = isCurrent ? state.error : null;
  const isLoading = deviceId !== null && !isCurrent;

  const refresh = useCallback(async () => {
    if (!deviceId) return;
    const id = ++requestId.current;
    const result = await fetchDashboardMeasurements(deviceId);
    if (id !== requestId.current) return;

    setState((prev) =>
      result.ok
        ? { deviceId, data: result.data, error: null }
        : {
            deviceId,
            data: prev.deviceId === deviceId ? prev.data : null,
            error: result.message,
          },
    );
  }, [deviceId]);

  // Actualiza al enfocar la pestaña y cuando cambia el dispositivo activo.
  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return { data, isLoading, error, refresh };
}