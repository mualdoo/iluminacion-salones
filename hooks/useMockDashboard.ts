import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { AppState } from 'react-native';

import { REFRESH_INTERVAL_MS } from '@/constants/dashboard';
import { createInitialSnapshot, generateNextSnapshot } from '@/services/mock/dashboardMockService';
import type { DashboardSnapshot } from '@/types/dashboard';

export function useMockDashboard() {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot>(() =>
    createInitialSnapshot(Date.now()),
  );

  const refresh = useCallback(() => {
    setSnapshot((prev) => generateNextSnapshot(prev, Date.now()));
  }, []);

  // El intervalo solo existe mientras la pantalla está enfocada y la app en primer plano.
  useFocusEffect(
    useCallback(() => {
      let intervalId: ReturnType<typeof setInterval> | null = null;

      const start = () => {
        if (intervalId === null) {
          intervalId = setInterval(refresh, REFRESH_INTERVAL_MS);
        }
      };
      const stop = () => {
        if (intervalId !== null) {
          clearInterval(intervalId);
          intervalId = null;
        }
      };

      start();
      const subscription = AppState.addEventListener('change', (state) => {
        if (state === 'active') start();
        else stop();
      });

      return () => {
        stop();
        subscription.remove();
      };
    }, [refresh]),
  );

  return { snapshot, refresh };
}