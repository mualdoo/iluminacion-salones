import { LIGHT_UNIT } from '@/constants/dashboard';
import type { DeviceStats, Recommendation } from '@/types/analytics';
import type { Configuration, Device, Measurement } from '@/types/database';
import { formatPeakWindow } from '@/utils/analytics';
import { getLightBand } from '@/utils/dashboard';
import { DEVICE_STATUS_META } from '@/utils/devices';
import { formatDateTime } from '@/utils/format';
import { RECOMMENDATION_META } from '@/utils/recommendations';

export type CsvCell = string | number | null | undefined;

// Un texto que empieza con estos caracteres podría ejecutarse como fórmula en Excel o LibreOffice.
const FORMULA_PREFIX = /^[=+\-@\t\r]/;

export function escapeCsvCell(value: CsvCell): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';
  const text = FORMULA_PREFIX.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function buildCsv(header: string[], rows: CsvCell[][]): string {
  return [header, ...rows].map((row) => row.map(escapeCsvCell).join(',')).join('\r\n') + '\r\n';
}

const round1 = (value: number | null): number | null =>
  value === null ? null : Math.round(value * 10) / 10;

function interpret(m: Measurement): string {
  if (m.measurement_type === 'motion') {
    return m.value === 1 ? 'Movimiento detectado' : 'Sin movimiento';
  }
  return `Iluminación ${getLightBand(m.value).label.toLowerCase()}`;
}

export function buildMeasurementsCsv(deviceName: string, measurements: Measurement[]): string {
  return buildCsv(
    ['dispositivo', 'tipo_medicion', 'valor', 'interpretacion', 'fecha_hora_local', 'fecha_hora_iso'],
    measurements.map((m) => [
      deviceName,
      m.measurement_type,
      Math.round(m.value * 100) / 100,
      interpret(m),
      formatDateTime(m.recorded_at),
      new Date(m.recorded_at).toISOString(),
    ]),
  );
}

export type SummaryCsvInput = {
  device: Pick<Device, 'name' | 'status'>;
  periodLabel: string;
  periodStart: number;
  generatedAt: number;
  limitReached: boolean;
  stats: DeviceStats;
  recommendations: Recommendation[];
  configuration: Pick<Configuration, 'light_threshold' | 'automatic_mode'> | null;
};

export function buildSummaryCsv(input: SummaryCsvInput): string {
  const { device, stats, configuration } = input;
  const rows: CsvCell[][] = [
    ['Dispositivo', 'Nombre', device.name, ''],
    ['Dispositivo', 'Estado', DEVICE_STATUS_META[device.status].label, ''],
    ['Periodo', 'Periodo analizado', input.periodLabel, ''],
    ['Periodo', 'Desde', formatDateTime(input.periodStart), ''],
    ['Periodo', 'Hasta', formatDateTime(input.generatedAt), ''],
    ['Periodo', 'Límite de registros alcanzado', input.limitReached ? 'Sí' : 'No', ''],
    ['Periodo', 'Lecturas analizadas', stats.totalReadings, 'lecturas'],
    ['Configuración', 'Umbral de iluminación', configuration?.light_threshold ?? null, LIGHT_UNIT],
    [
      'Configuración',
      'Modo de operación',
      configuration ? (configuration.automatic_mode ? 'Automático' : 'Manual') : 'Sin configuración',
      '',
    ],
    ['Iluminación', 'Lecturas', stats.light.count, 'lecturas'],
    ['Iluminación', 'Promedio', round1(stats.light.average), LIGHT_UNIT],
    ['Iluminación', 'Mínimo', round1(stats.light.min), LIGHT_UNIT],
    ['Iluminación', 'Máximo', round1(stats.light.max), LIGHT_UNIT],
    ['Iluminación', 'Lecturas bajo el umbral', round1(stats.light.belowThresholdPct), '%'],
    ['Iluminación', 'Lecturas con iluminación suficiente', round1(stats.light.sufficientPct), '%'],
    ['Ocupación', 'Muestras de movimiento', stats.motion.samples, 'muestras'],
    ['Ocupación', 'Eventos de movimiento detectado', stats.motion.detected, 'eventos'],
    ['Ocupación', 'Muestras con presencia', round1(stats.motion.presencePct), '%'],
    ['Ocupación', 'Franja horaria pico', formatPeakWindow(stats.motion.peakWindow), ''],
    ['Luminaria', 'Comandos de encendido ejecutados', stats.lamp.turnedOn, 'comandos'],
    ['Luminaria', 'Comandos de apagado ejecutados', stats.lamp.turnedOff, 'comandos'],
  ];

  for (const band of stats.bands) {
    const name = `${band.label} (${band.range})`;
    rows.push(['Franjas horarias', `${name} - lecturas de iluminación`, band.lightCount, 'lecturas']);
    rows.push(['Franjas horarias', `${name} - iluminación promedio`, round1(band.lightAverage), LIGHT_UNIT]);
    rows.push(['Franjas horarias', `${name} - movimientos detectados`, band.motionDetected, 'eventos']);
  }

  input.recommendations.forEach((rec, index) => {
    const label = `Recomendación ${index + 1}`;
    rows.push(['Recomendaciones', `${label} - categoría`, RECOMMENDATION_META[rec.category].label, '']);
    rows.push(['Recomendaciones', `${label} - título`, rec.title, '']);
    rows.push(['Recomendaciones', `${label} - explicación`, rec.explanation, '']);
    rows.push(['Recomendaciones', `${label} - acción sugerida`, rec.action, '']);
  });

  return buildCsv(['seccion', 'metrica', 'valor', 'unidad'], rows);
}