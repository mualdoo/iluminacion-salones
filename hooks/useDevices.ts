import { useContext } from 'react';

import { DeviceContext } from '@/providers/DeviceProvider';

export function useDevices() {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error('useDevices debe usarse dentro de <DeviceProvider>.');
  }
  return context;
}