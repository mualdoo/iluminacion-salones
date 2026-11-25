import { COMMAND_RECENT_MINUTES, COMMAND_TYPE_SET_LIGHT } from '@/constants/control';
import { OCCUPANCY_WINDOW_MINUTES } from '@/constants/measurements';
import type { DeviceAlert } from '@/types/alerts';
import type { LampState } from '@/types/control';
import type { Command, Configuration, Device } from '@/types/database';
import type { RealDashboardData } from '@/types/measurements';
import { evaluateDeviceAlerts } from '@/utils/alerts';
import { formatDateTime } from '@/utils/format';

const MINUTE_MS = 60_000;

/** Ocupado si hubo movimiento (valor 1) dentro de la ventana de ocupación. */
export function estimateOccupied(
  data: Pick<RealDashboardData, 'lastMotionDetectedAt' | 'fetchedAt'>,
): boolean {
  return (
    data.lastMotionDetectedAt !== null &&
    data.fetchedAt - data.lastMotionDetectedAt <= OCCUPANCY_WINDOW_MINUTES * MINUTE_MS
  );
}

type LampInput = {
  commands: Command[];
  configuration: Configuration | null;
  lightLevel: number | null;
  occupied: boolean;
  now: number;
};

export function deriveLampState(input: LampInput): LampState {
  const lampCommands = input.commands
    .filter(
      (c) => c.command_type === COMMAND_TYPE_SET_LIGHT && (c.value === 'on' || c.value === 'off'),
    )
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));

  const latestPending = lampCommands.find((c) => c.status === 'pending');
  const latestExecuted = lampCommands.find((c) => c.status === 'executed');
  const isAutomatic = input.configuration?.automatic_mode === true;

  // 1. Un comando pendiente más nuevo que el último ejecutado es lo que se pidió más recientemente.
  if (
    latestPending &&
    (!latestExecuted || Date.parse(latestPending.created_at) > Date.parse(latestExecuted.created_at))
  ) {
    return {
      on: latestPending.value === 'on',
      pending: true,
      source: 'pending',
      since: Date.parse(latestPending.created_at),
    };
  }

  // 2. Último comando ejecutado. En automático solo cuenta si es reciente.
  if (latestExecuted) {
    const executedAt = Date.parse(latestExecuted.executed_at ?? latestExecuted.created_at);
    const isRecent = input.now - executedAt <= COMMAND_RECENT_MINUTES * MINUTE_MS;
    if (!isAutomatic || isRecent) {
      return {
        on: latestExecuted.value === 'on',
        pending: false,
        source: 'executed',
        since: executedAt,
      };
    }
  }

  // 3. Modo automático sin comandos útiles: estimación frente al umbral.
  if (isAutomatic && input.configuration && input.lightLevel !== null) {
    return {
      on: input.occupied && input.lightLevel < input.configuration.light_threshold,
      pending: false,
      source: 'estimated',
      since: null,
    };
  }

  return { on: null, pending: false, source: 'none', since: null };
}

export function describeLampSource(lamp: LampState): string {
  switch (lamp.source) {
    case 'executed':
      return lamp.since
        ? `Según el último comando ejecutado (${formatDateTime(lamp.since)}).`
        : 'Según el último comando ejecutado.';
    case 'pending':
      return 'Comando enviado: pendiente de ejecución por el dispositivo.';
    case 'estimated':
      return 'Estimado en modo automático según la ocupación y el umbral de iluminación.';
    default:
      return 'Aún no hay comandos ni datos suficientes para conocer el estado de la luz.';
  }
}

type RealInput = {
  device: Device;
  data: RealDashboardData | null;
  configuration: Configuration | null;
  commands: Command[];
  now: number;
};

export type RealDeviceAnalysis = {
  occupied: boolean | null;
  lamp: LampState;
  alerts: DeviceAlert[];
};

/** Estado derivado de un dispositivo real: ocupación, luminaria y alertas. */
export function analyzeRealDevice({
  device,
  data,
  configuration,
  commands,
  now,
}: RealInput): RealDeviceAnalysis {
  const occupied = data ? estimateOccupied(data) : null;
  const lightLevel = data?.latestLight?.value ?? null;

  const lamp = deriveLampState({
    commands,
    configuration,
    lightLevel,
    occupied: occupied ?? false,
    now,
  });

  const alerts = evaluateDeviceAlerts({
    now,
    deviceStatus: device.status,
    lastSeenAt: device.last_seen_at ? Date.parse(device.last_seen_at) : null,
    lightLevel,
    lightThreshold: configuration?.light_threshold ?? null,
    occupied,
    lampOn: lamp.on,
    lampPending: lamp.pending,
    automaticMode: configuration ? configuration.automatic_mode : null,
    pendingCommandDates: commands
      .filter((c) => c.status === 'pending')
      .map((c) => Date.parse(c.created_at)),
  });

  return { occupied, lamp, alerts };
}