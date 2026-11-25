import {
    BELOW_THRESHOLD_ALERT_PCT,
    FREQUENT_MANUAL_ON,
    HIGH_AVERAGE_LIGHT,
    HIGH_AVERAGE_RATIO,
    LOW_PRESENCE_PCT,
    MANY_MANUAL_COMMANDS,
    MAX_RECOMMENDATIONS,
    MIN_READINGS_FOR_ANALYSIS,
} from '@/constants/analytics';
import { LIGHT_UNIT } from '@/constants/dashboard';
import type { Tone } from '@/constants/theme';
import type {
    Recommendation,
    RecommendationCategory,
    RecommendationInput,
} from '@/types/analytics';
import type { IconName } from '@/types/ui';

export const RECOMMENDATION_META: Record<
  RecommendationCategory,
  { label: string; icon: IconName; tone: Tone }
> = {
  energy: { label: 'Ahorro energético', icon: 'leaf-outline', tone: 'success' },
  comfort: { label: 'Confort visual', icon: 'eye-outline', tone: 'info' },
  automation: { label: 'Automatización', icon: 'sync-outline', tone: 'info' },
  maintenance: { label: 'Mantenimiento', icon: 'construct-outline', tone: 'warning' },
};

const round50 = (value: number) => Math.round(value / 50) * 50;

/** Función pura: de 1 a 4 recomendaciones a partir de las estadísticas y la configuración. */
export function generateDeviceRecommendations({
  stats,
  configuration,
}: RecommendationInput): Recommendation[] {
  if (stats.totalReadings < MIN_READINGS_FOR_ANALYSIS) {
    const n = stats.totalReadings;
    return [
      {
        id: 'low_data',
        category: 'maintenance',
        title: 'Pocas mediciones en este periodo',
        explanation: `Solo se registr${n === 1 ? 'ó' : 'aron'} ${n} medición${n === 1 ? '' : 'es'} en el periodo analizado, lo que no basta para sacar conclusiones fiables.`,
        action:
          'Verifica que el dispositivo esté encendido, conectado a WiFi y enviando datos con la frecuencia esperada antes de ajustar la configuración.',
      },
    ];
  }

  const list: Recommendation[] = [];

  if (stats.light.count === 0) {
    list.push({
      id: 'no_light_data',
      category: 'maintenance',
      title: 'El sensor de iluminación no reporta datos',
      explanation: 'Hay lecturas de movimiento, pero ninguna de iluminación en este periodo.',
      action: 'Revisa la conexión del fotoresistor (LDR) al ESP32 y su lectura analógica.',
    });
  }
  if (stats.motion.samples === 0) {
    list.push({
      id: 'no_motion_data',
      category: 'maintenance',
      title: 'El sensor de movimiento no reporta datos',
      explanation: 'Hay lecturas de iluminación, pero ninguna de movimiento en este periodo.',
      action: 'Revisa la alimentación y el cableado del sensor PIR.',
    });
  }

  if (configuration && !configuration.automatic_mode) {
    const frequentManual = stats.lamp.turnedOn >= FREQUENT_MANUAL_ON;
    const presence = stats.motion.presencePct;
    const lowPresence = presence !== null && presence < LOW_PRESENCE_PCT;
    if (frequentManual || lowPresence) {
      const reasons: string[] = [];
      if (frequentManual) reasons.push(`se ejecutaron ${stats.lamp.turnedOn} encendidos manuales`);
      if (lowPresence && presence !== null) {
        reasons.push(`la presencia estimada fue baja (${Math.round(presence)} %)`);
      }
      list.push({
        id: 'enable_automatic',
        category: 'energy',
        title: 'Activa el modo automático para ahorrar energía',
        explanation: `El dispositivo está en modo manual y ${reasons.join(' y ')}. Con la luz bajo control manual es fácil dejarla encendida en horarios vacíos.`,
        action:
          'En la pestaña Control, cambia a modo Automático para que la luz dependa de la presencia y del umbral.',
      });
    }
  }

  if (configuration) {
    const below = stats.light.belowThresholdPct;
    const average = stats.light.average;
    const threshold = configuration.light_threshold;

    if (below !== null && average !== null && below > BELOW_THRESHOLD_ALERT_PCT) {
      const suggested = Math.max(0, round50(average));
      list.push({
        id: 'threshold_high',
        category: 'comfort',
        title: 'Muchas lecturas quedan bajo el umbral',
        explanation: `${Math.round(below)} % de las lecturas estuvo por debajo del umbral (${Math.round(threshold)} ${LIGHT_UNIT}). Con ese valor, la iluminación se considera insuficiente casi todo el tiempo.`,
        action: `Si el salón se siente bien iluminado, baja el umbral hacia ${suggested} ${LIGHT_UNIT} (promedio: ${Math.round(average)}). Si se siente oscuro, revisa la luminaria o la posición del sensor.`,
      });
    } else if (
      average !== null &&
      average > HIGH_AVERAGE_LIGHT &&
      average >= threshold * HIGH_AVERAGE_RATIO
    ) {
      const suggested = Math.min(1000, round50(average * 0.8));
      list.push({
        id: 'threshold_low',
        category: 'comfort',
        title: 'El umbral es bajo para la iluminación habitual',
        explanation: `El promedio (${Math.round(average)} ${LIGHT_UNIT}) supera ampliamente el umbral (${Math.round(threshold)} ${LIGHT_UNIT}), así que en modo automático la luz casi nunca se activaría.`,
        action: `Si hay momentos con poca luz natural en los que sí hace falta luz artificial, sube el umbral (por ejemplo, a ${suggested} ${LIGHT_UNIT}) y compara resultados.`,
      });
    }
  }

  if (configuration?.automatic_mode && stats.lamp.total >= MANY_MANUAL_COMMANDS) {
    list.push({
      id: 'manual_overrides',
      category: 'automation',
      title: 'Muchos comandos manuales con el modo automático activo',
      explanation: `Se ejecutaron ${stats.lamp.total} comandos manuales mientras el modo automático está activo. Suele indicar que el umbral no coincide con lo que se espera del salón.`,
      action:
        'Ajusta el umbral de iluminación en la pestaña Control hasta que el modo automático no necesite correcciones.',
    });
  }

  if (list.length === 0) {
    list.push({
      id: 'all_good',
      category: 'comfort',
      title: 'Sin ajustes recomendados',
      explanation: 'Con los datos del periodo, la configuración actual parece adecuada.',
      action:
        'Sigue monitoreando y revisa de nuevo cuando haya más datos o cambien las condiciones del salón.',
    });
  }

  return list.slice(0, MAX_RECOMMENDATIONS);
}