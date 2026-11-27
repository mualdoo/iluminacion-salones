export type ConfigurationInput = {
  light_threshold: number;
  automatic_mode: boolean;
};

export type LampCommandValue = 'on' | 'off';

export type LampStateSource = 'executed' | 'pending' | 'estimated' | 'none';

export type LampState = {
  /** null = sin datos. */
  on: boolean | null;
  /** true si el estado mostrado es el de un comando aún no ejecutado. */
  pending: boolean;
  source: LampStateSource;
  /** Marca de tiempo (ms) del comando que define el estado, si aplica. */
  since: number | null;
};