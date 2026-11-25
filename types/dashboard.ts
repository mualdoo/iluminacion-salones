export type ConnectionStatus = 'connected' | 'disconnected';
export type OperationMode = 'automatic' | 'manual';

export type ActivityEventType =
  | 'motion_detected'
  | 'room_vacated'
  | 'light_on'
  | 'light_off'
  | 'device_connected'
  | 'device_disconnected'
  | 'mode_automatic'
  | 'mode_manual';

export type LightSample = {
  timestamp: number;
  value: number; // 0 a 1000, unidades relativas
};

export type ActivityEvent = {
  id: string;
  type: ActivityEventType;
  description: string;
  timestamp: number;
};

// Estado simulado completo del salón. Vive solo en memoria.
export type DashboardSnapshot = {
  lightLevel: number;
  motionDetected: boolean;
  occupied: boolean;
  lampOn: boolean;
  mode: OperationMode;
  connection: ConnectionStatus;
  history: LightSample[];
  events: ActivityEvent[];
  updatedAt: number;
  /** Interno de la simulación: ciclos seguidos sin movimiento. */
  ticksWithoutMotion: number;
};