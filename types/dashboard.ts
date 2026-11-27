export type ConnectionStatus = 'connected' | 'disconnected';
export type OperationMode = 'automatic' | 'manual';

export type LightSample = {
  timestamp: number;
  value: number; // 0 a 1000, unidades relativas
};