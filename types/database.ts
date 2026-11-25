export type DeviceStatus = 'online' | 'offline' | 'pending';
export type MeasurementType = 'light' | 'motion';
export type CommandStatus = 'pending' | 'executed' | 'failed';

export type Profile = {
  id: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
};

export type Device = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: DeviceStatus;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Measurement = {
  id: string;
  device_id: string;
  measurement_type: MeasurementType;
  value: number; // motion: 0 o 1
  recorded_at: string;
};

export type Configuration = {
  id: string;
  device_id: string;
  light_threshold: number;
  automatic_mode: boolean;
  created_at: string;
  updated_at: string;
};

export type Command = {
  id: string;
  device_id: string;
  command_type: string;
  value: string | null;
  status: CommandStatus;
  created_at: string;
  executed_at: string | null;
};