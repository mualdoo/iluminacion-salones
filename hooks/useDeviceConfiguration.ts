import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import {
    fetchConfiguration,
    updateConfiguration,
} from '@/services/configurations/configurationService';
import type { ConfigurationInput } from '@/types/control';
import type { Configuration } from '@/types/database';
import type { ServiceResult } from '@/types/service';

type State = {
  deviceId: string | null;
  data: Configuration | null;
  error: string | null;
};

export function useDeviceConfiguration(deviceId: string | null) {
  const [state, setState] = useState<State>({ deviceId: null, data: null, error: null });
  const [isSaving, setIsSaving] = useState(false);
  const requestId = useRef(0);

  // Lo guardado pertenece a otro dispositivo: se trata como "cargando" y sin datos.
  const isCurrent = deviceId !== null && state.deviceId === deviceId;
  const configuration = isCurrent ? state.data : null;
  const error = isCurrent ? state.error : null;
  const isLoading = deviceId !== null && !isCurrent;
  const notFound = isCurrent && state.data === null && state.error === null;

  const refresh = useCallback(async () => {
    if (!deviceId) return;
    const id = ++requestId.current;
    const result = await fetchConfiguration(deviceId);
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

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const save = useCallback(
    async (input: ConfigurationInput): Promise<ServiceResult<Configuration>> => {
      if (!deviceId) return { ok: false, message: 'Selecciona un dispositivo primero.' };
      setIsSaving(true);
      const result = await updateConfiguration(deviceId, input);
      setIsSaving(false);
      if (result.ok) {
        requestId.current += 1; // descarta cargas en curso con datos anteriores
        setState({ deviceId, data: result.data, error: null });
      }
      return result;
    },
    [deviceId],
  );

  return { configuration, isLoading, error, notFound, isSaving, save, refresh };
}