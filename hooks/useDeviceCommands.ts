import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { COMMANDS_LIMIT } from '@/constants/control';
import {
    deleteCommandById,
    fetchCommands,
    insertLampCommand,
} from '@/services/commands/commandService';
import type { LampCommandValue } from '@/types/control';
import type { Command } from '@/types/database';
import type { ServiceResult } from '@/types/service';

type State = {
  deviceId: string | null;
  items: Command[];
  error: string | null;
};

/**
 * @param pollMs Si se indica, refresca en ese intervalo mientras la pantalla está enfocada
 * y la app en primer plano. El intervalo se limpia al salir de la pantalla.
 */
export function useDeviceCommands(deviceId: string | null, pollMs: number | null = null) {
  const [state, setState] = useState<State>({ deviceId: null, items: [], error: null });
  const [isSending, setIsSending] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const requestId = useRef(0);

  const isCurrent = deviceId !== null && state.deviceId === deviceId;
  const commands = isCurrent ? state.items : [];
  const error = isCurrent ? state.error : null;
  const isLoading = deviceId !== null && !isCurrent;

  const refresh = useCallback(async () => {
    if (!deviceId) return;
    const id = ++requestId.current;
    const result = await fetchCommands(deviceId, COMMANDS_LIMIT);
    if (id !== requestId.current) return;

    setState((prev) =>
      result.ok
        ? { deviceId, items: result.data, error: null }
        : {
            deviceId,
            items: prev.deviceId === deviceId ? prev.items : [],
            error: result.message,
          },
    );
  }, [deviceId]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
      if (!pollMs) return undefined;

      let intervalId: ReturnType<typeof setInterval> | null = null;
      const start = () => {
        if (intervalId === null) {
          intervalId = setInterval(() => void refresh(), pollMs);
        }
      };
      const stop = () => {
        if (intervalId !== null) {
          clearInterval(intervalId);
          intervalId = null;
        }
      };

      start();
      const subscription = AppState.addEventListener('change', (appState) => {
        if (appState === 'active') {
          void refresh();
          start();
        } else {
          stop();
        }
      });

      return () => {
        stop();
        subscription.remove();
      };
    }, [refresh, pollMs]),
  );

  const send = useCallback(
    async (value: LampCommandValue): Promise<ServiceResult<Command>> => {
      if (!deviceId) return { ok: false, message: 'Selecciona un dispositivo primero.' };
      setIsSending(true);
      const result = await insertLampCommand(deviceId, value);
      setIsSending(false);
      if (result.ok) {
        requestId.current += 1; // descarta cargas en curso
        setState((prev) => {
          const base = prev.deviceId === deviceId ? prev.items : [];
          return { deviceId, items: [result.data, ...base].slice(0, COMMANDS_LIMIT), error: null };
        });
      }
      return result;
    },
    [deviceId],
  );

  const cancel = useCallback(
    async (id: string): Promise<ServiceResult<null>> => {
      setBusyId(id);
      const result = await deleteCommandById(id);
      setBusyId(null);
      if (result.ok) {
        setState((prev) => ({ ...prev, items: prev.items.filter((c) => c.id !== id) }));
      } else {
        void refresh(); // por si el comando cambió de estado mientras tanto
      }
      return result;
    },
    [refresh],
  );

  return { commands, isLoading, error, isSending, busyId, send, cancel, refresh };
}