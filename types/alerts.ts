import type { DeviceStatus } from '@/types/database';

export type AlertSeverity = 'info' | 'warning' | 'critical';

export type AlertKind =
  | 'low_light_occupied'
  | 'lamp_on_vacant'
  | 'device_offline'
  | 'device_pending'
  | 'pending_commands';

export type DeviceAlert = {
  id: AlertKind;
  severity: AlertSeverity;
  title: string;
  description: string;
  /** Marca de tiempo (ms). */
  timestamp: number;
};

export type AlertInput = {
  now: number;
  deviceStatus: DeviceStatus;
  lastSeenAt: number | null;
  lightLevel: number | null;
  lightThreshold: number | null;
  /** null = desconocido. */
  occupied: boolean | null;
  /** null = desconocido. */
  lampOn: boolean | null;
  lampPending: boolean;
  /** null = sin configuración. */
  automaticMode: boolean | null;
  /** created_at (ms) de cada comando en estado pending. */
  pendingCommandDates: number[];
};