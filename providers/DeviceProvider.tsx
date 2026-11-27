import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { useAuth } from '@/hooks/useAuth';
import { loadActiveDeviceId, saveActiveDeviceId } from '@/services/devices/activeDeviceStorage';
import {
  deleteDeviceById,
  ensureDeviceToken,
  fetchDevices,
  insertDevice,
  updateDeviceById,
  type DeviceTokenResult,
} from '@/services/devices/deviceService';
import type { Device } from '@/types/database';
import type { DeviceInput, ServiceResult } from '@/types/service';

type DeviceContextValue = {
  devices: Device[];
  activeDevice: Device | null;
  /** true solo durante la carga inicial. */
  isLoading: boolean;
  error: string | null;
  selectDevice: (id: string) => void;
  refreshDevices: () => Promise<void>;
  createDevice: (input: DeviceInput) => Promise<ServiceResult<Device>>;
  updateDevice: (id: string, input: DeviceInput) => Promise<ServiceResult<Device>>;
  deleteDevice: (id: string) => Promise<ServiceResult<null>>;
  getDeviceToken: (id: string) => Promise<ServiceResult<DeviceTokenResult>>;
};

export const DeviceContext = createContext<DeviceContextValue | undefined>(undefined);

export function DeviceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [devices, setDevices] = useState<Device[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Copia síncrona del id activo para usarla dentro de callbacks asíncronos.
  const activeIdRef = useRef<string | null>(null);

  const applyActive = useCallback(
    (id: string | null) => {
      activeIdRef.current = id;
      setActiveDeviceId(id);
      if (userId) void saveActiveDeviceId(userId, id);
    },
    [userId],
  );

  const refreshDevices = useCallback(async () => {
    const result = await fetchDevices();
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setError(null);
    setDevices(result.data);

    const current = activeIdRef.current;
    const next = result.data.some((d) => d.id === current) ? current : (result.data[0]?.id ?? null);
    if (next !== current) applyActive(next);
  }, [applyActive]);

  // Carga inicial: dispositivo recordado + lista desde Supabase.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    (async () => {
      const stored = await loadActiveDeviceId(userId);
      if (cancelled) return;
      activeIdRef.current = stored;
      setActiveDeviceId(stored);
      await refreshDevices();
      if (!cancelled) setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, refreshDevices]);

  const selectDevice = useCallback((id: string) => applyActive(id), [applyActive]);

  const createDevice = useCallback(
    async (input: DeviceInput): Promise<ServiceResult<Device>> => {
      if (!userId) return { ok: false, message: 'No hay una sesión válida.' };
      const result = await insertDevice(userId, input);
      if (result.ok) {
        setDevices((prev) => [...prev, result.data]);
        if (!activeIdRef.current) applyActive(result.data.id);
        // Genera y guarda el token. Si falla, el modal de credenciales lo reintenta al abrirse.
        await ensureDeviceToken(result.data.id);
      }
      return result;
    },
    [userId, applyActive],
  );

  const updateDevice = useCallback(
    async (id: string, input: DeviceInput): Promise<ServiceResult<Device>> => {
      const result = await updateDeviceById(id, input);
      if (result.ok) {
        setDevices((prev) => prev.map((d) => (d.id === id ? result.data : d)));
      }
      return result;
    },
    [],
  );

  const deleteDevice = useCallback(
    async (id: string): Promise<ServiceResult<null>> => {
      const result = await deleteDeviceById(id);
      if (result.ok) {
        const remaining = devices.filter((d) => d.id !== id);
        setDevices(remaining);
        if (activeIdRef.current === id) applyActive(remaining[0]?.id ?? null);
      }
      return result;
    },
    [devices, applyActive],
  );

  const activeDevice = useMemo(
    () => devices.find((d) => d.id === activeDeviceId) ?? null,
    [devices, activeDeviceId],
  );

  const value = useMemo<DeviceContextValue>(
    () => ({
      devices,
      activeDevice,
      isLoading,
      error,
      selectDevice,
      refreshDevices,
      createDevice,
      updateDevice,
      deleteDevice,
      getDeviceToken: ensureDeviceToken,
    }),
    [
      devices,
      activeDevice,
      isLoading,
      error,
      selectDevice,
      refreshDevices,
      createDevice,
      updateDevice,
      deleteDevice,
    ],
  );

  return <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>;
}