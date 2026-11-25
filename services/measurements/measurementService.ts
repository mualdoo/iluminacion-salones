import { EXPORT_PAGE_SIZE } from '@/constants/analytics';
import {
  DASHBOARD_LIGHT_SAMPLES,
  DASHBOARD_MOTION_SAMPLES,
  DASHBOARD_RECENT_COUNT,
} from '@/constants/measurements';
import { getSupabaseClient } from '@/services/supabase/client';
import type { LightSample } from '@/types/dashboard';
import type { Measurement, MeasurementType } from '@/types/database';
import type { ValueFilter } from '@/types/history';
import type { MeasurementTypeFilter, RealDashboardData } from '@/types/measurements';
import type { ServiceResult } from '@/types/service';
import { GENERIC_ERROR, translatePostgrestError } from '@/utils/supabaseErrors';

export const MEASUREMENT_COLUMNS = 'id, device_id, measurement_type, value, recorded_at';

type Row = {
  id: string;
  device_id: string;
  measurement_type: MeasurementType;
  value: number | string;
  recorded_at: string;
};

const toMeasurement = (row: Row): Measurement => ({
  id: row.id,
  device_id: row.device_id,
  measurement_type: row.measurement_type,
  value: Number(row.value),
  recorded_at: row.recorded_at,
});

export const toMeasurements = (rows: unknown): Measurement[] =>
  ((rows ?? []) as Row[]).map(toMeasurement);

export type MeasurementQuery = {
  deviceId: string;
  type: MeasurementTypeFilter;
  /** Solo se aplica si type es 'light' o 'motion'. */
  valueFilter: ValueFilter;
  /** light_threshold, necesario para los filtros "bajo/sobre umbral". */
  threshold: number | null;
  /** Fecha ISO mínima de recorded_at, o null para todo el historial. */
  since: string | null;
  ascending: boolean;
  offset: number;
  limit: number;
};

export async function fetchMeasurements(q: MeasurementQuery): Promise<ServiceResult<Measurement[]>> {
  try {
    let query = getSupabaseClient()
      .from('measurements')
      .select(MEASUREMENT_COLUMNS)
      .eq('device_id', q.deviceId);

    if (q.type !== 'all') query = query.eq('measurement_type', q.type);
    if (q.since) query = query.gte('recorded_at', q.since);

    if (q.type === 'light' && q.threshold !== null) {
      if (q.valueFilter === 'below') query = query.lt('value', q.threshold);
      else if (q.valueFilter === 'above') query = query.gte('value', q.threshold);
    }
    if (q.type === 'motion') {
      if (q.valueFilter === 'detected') query = query.eq('value', 1);
      else if (q.valueFilter === 'none') query = query.eq('value', 0);
    }

    const { data, error } = await query
      .order('recorded_at', { ascending: q.ascending })
      .order('id', { ascending: q.ascending })
      .range(q.offset, q.offset + q.limit - 1);

    if (error) return { ok: false, message: translatePostgrestError(error) };
    return { ok: true, data: toMeasurements(data) };
  } catch {
    return { ok: false, message: GENERIC_ERROR };
  }
}

/** Trae el historial con los filtros indicados, en páginas, hasta maxRows filas. */
export async function fetchMeasurementsForExport(
  base: Omit<MeasurementQuery, 'offset' | 'limit'>,
  maxRows: number,
): Promise<ServiceResult<{ rows: Measurement[]; truncated: boolean }>> {
  const rows: Measurement[] = [];

  while (rows.length < maxRows) {
    const limit = Math.min(EXPORT_PAGE_SIZE, maxRows - rows.length);
    const page = await fetchMeasurements({ ...base, offset: rows.length, limit });
    if (!page.ok) return page;
    rows.push(...page.data);
    if (page.data.length < limit) return { ok: true, data: { rows, truncated: false } };
  }

  // Se llegó al máximo: una consulta extra confirma si había más filas.
  const probe = await fetchMeasurements({ ...base, offset: rows.length, limit: 1 });
  if (!probe.ok) return probe;
  return { ok: true, data: { rows, truncated: probe.data.length > 0 } };
}

export async function fetchDashboardMeasurements(
  deviceId: string,
): Promise<ServiceResult<RealDashboardData>> {
  try {
    const supabase = getSupabaseClient();
    const base = () =>
      supabase.from('measurements').select(MEASUREMENT_COLUMNS).eq('device_id', deviceId);

    const [light, motion, lastMotion] = await Promise.all([
      base()
        .eq('measurement_type', 'light')
        .order('recorded_at', { ascending: false })
        .limit(DASHBOARD_LIGHT_SAMPLES),
      base()
        .eq('measurement_type', 'motion')
        .order('recorded_at', { ascending: false })
        .limit(DASHBOARD_MOTION_SAMPLES),
      base()
        .eq('measurement_type', 'motion')
        .eq('value', 1)
        .order('recorded_at', { ascending: false })
        .limit(1),
    ]);

    const failure = light.error ?? motion.error ?? lastMotion.error;
    if (failure) return { ok: false, message: translatePostgrestError(failure) };

    const lightRows = toMeasurements(light.data); // más reciente primero
    const motionRows = toMeasurements(motion.data);
    const lastMotionRow = toMeasurements(lastMotion.data)[0];

    const lightSamples: LightSample[] = lightRows
      .slice()
      .reverse()
      .map((m) => ({ timestamp: new Date(m.recorded_at).getTime(), value: m.value }));

    const recent = [...lightRows, ...motionRows]
      .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())
      .slice(0, DASHBOARD_RECENT_COUNT);

    return {
      ok: true,
      data: {
        lightSamples,
        latestLight: lightRows[0] ?? null,
        latestMotion: motionRows[0] ?? null,
        lastMotionDetectedAt: lastMotionRow ? new Date(lastMotionRow.recorded_at).getTime() : null,
        recent,
        hasData: lightRows.length > 0 || motionRows.length > 0,
        fetchedAt: Date.now(),
      },
    };
  } catch {
    return { ok: false, message: GENERIC_ERROR };
  }
}