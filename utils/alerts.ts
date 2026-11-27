import {
    PENDING_COMMAND_ALERT_MINUTES,
    PENDING_COMMAND_CRITICAL_MINUTES,
} from '@/constants/control';
import { LIGHT_UNIT } from '@/constants/dashboard';
import type { Tone } from '@/constants/theme';
import type { AlertInput, AlertSeverity, DeviceAlert } from '@/types/alerts';
import type { IconName } from '@/types/ui';

export const ALERT_SEVERITY_META: Record<
  AlertSeverity,
  { label: string; tone: Tone; icon: IconName }
> = {
  info: { label: 'Info', tone: 'info', icon: 'information-circle-outline' },
  warning: { label: 'Advertencia', tone: 'warning', icon: 'warning-outline' },
  critical: { label: 'Crítica', tone: 'error', icon: 'alert-circle' },
};

const SEVERITY_ORDER: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };
const MINUTE_MS = 60_000;

/**
 * Función pura: evalúa el estado del dispositivo activo y devuelve las alertas vigentes.
 * Las reglas de iluminación y ocupación solo se evalúan con el dispositivo en línea,
 * porque con un dispositivo caído los últimos datos pueden ser viejos.
 */
export function evaluateDeviceAlerts(input: AlertInput): DeviceAlert[] {
  const alerts: DeviceAlert[] = [];
  const online = input.deviceStatus === 'online';

  // 3. Dispositivo desconectado o pendiente
  if (input.deviceStatus === 'offline') {
    alerts.push({
      id: 'device_offline',
      severity: 'critical',
      title: 'Dispositivo desconectado',
      description:
        'No hay conexión con el dispositivo. Los datos mostrados pueden no estar actualizados.',
      timestamp: input.lastSeenAt ?? input.now,
    });
  } else if (input.deviceStatus === 'pending') {
    alerts.push({
      id: 'device_pending',
      severity: 'info',
      title: 'Dispositivo pendiente de conexión',
      description: 'El dispositivo está registrado pero todavía no se ha conectado.',
      timestamp: input.lastSeenAt ?? input.now,
    });
  }

  if (online) {
    // 1. Iluminación baja con el salón ocupado
    if (
      input.occupied === true &&
      input.lightLevel !== null &&
      input.lightThreshold !== null &&
      input.lightLevel < input.lightThreshold
    ) {
      const manualAndOff = input.automaticMode === false && input.lampOn !== true;
      const severity: AlertSeverity = manualAndOff
        ? 'critical'
        : input.lampOn === true
          ? 'info'
          : 'warning';
      alerts.push({
        id: 'low_light_occupied',
        severity,
        title: 'Iluminación baja con salón ocupado',
        description:
          `El nivel (${Math.round(input.lightLevel)} ${LIGHT_UNIT}) está por debajo del umbral ` +
          `(${Math.round(input.lightThreshold)} ${LIGHT_UNIT}) y se detectó presencia.` +
          (manualAndOff ? ' La luz sigue apagada en modo manual.' : ''),
        timestamp: input.now,
      });
    }

    // 2. Luminaria encendida con el salón desocupado
    if (input.lampOn === true && input.occupied === false) {
      alerts.push({
        id: 'lamp_on_vacant',
        severity: 'warning',
        title: 'Luz encendida en salón desocupado',
        description:
          'No se detectó movimiento reciente y la luz sigue encendida' +
          (input.lampPending ? ' (según un comando pendiente).' : '.') +
          ' Apágala para ahorrar energía.',
        timestamp: input.now,
      });
    }
  }

  // 4. Comandos pendientes sin ejecutar
  const limit = input.now - PENDING_COMMAND_ALERT_MINUTES * MINUTE_MS;
  const stale = input.pendingCommandDates.filter((t) => Number.isFinite(t) && t <= limit);
  if (stale.length > 0) {
    const oldest = Math.min(...stale);
    const critical = input.now - oldest > PENDING_COMMAND_CRITICAL_MINUTES * MINUTE_MS;
    alerts.push({
      id: 'pending_commands',
      severity: critical ? 'critical' : 'warning',
      title: 'Comandos sin ejecutar',
      description:
        `${stale.length} comando${stale.length === 1 ? '' : 's'} pendiente${stale.length === 1 ? '' : 's'} ` +
        `lleva${stale.length === 1 ? '' : 'n'} más de ${PENDING_COMMAND_ALERT_MINUTES} minutos sin ejecutarse. ` +
        'Puede que el dispositivo aún no responda.',
      timestamp: oldest,
    });
  }

  return alerts.sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || b.timestamp - a.timestamp,
  );
}