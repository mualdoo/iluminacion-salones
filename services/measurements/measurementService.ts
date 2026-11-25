import {
    DASHBOARD_LIGHT_SAMPLES,
    DASHBOARD_MOTION_SAMPLES,
    DASHBOARD_RECENT_COUNT,
} from '@/constants/measurements';
import { getSupabaseClient } from '@/services/supabase/client';
import type { LightSample } from '@/types/dashboard';
import type { Measurement, MeasurementType } from '@/types/database';
import type { MeasurementTypeFilter, RealDashboardData } from '@/types/measurements';
import type { ServiceResult } from '@/types/service';
import { GENERIC_ERROR, translatePostgrestError } from '@/utils/supabaseErrors';

const COLUMNS = 'id, device_id, measurement_type, value, recorded_at';

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

const toMeasurements = (rows: unknown): Measurement[] => ((rows ?? []) as Row[]).map(toMeasurement);

export type MeasurementQuery = {
  deviceId: string;
  type: MeasurementTypeFilter;
  /** Fecha ISO mínima de recorded_at, o null para todo el historial. */
  since: string | null;
  offset: number;
  limit: number;
};

export async function fetchMeasurements(q: MeasurementQuery): Promise<ServiceResult<Measurement[]>> {
  try {
    let query = getSupabaseClient().from('measurements').select(COLUMNS).eq('device_id', q.deviceId);
    if (q.type !== 'all') query = query.eq('measurement_type', q.type);
    if (q.since) query = query.gte('recorded_at', q.since);

    const { data, error } = await query
      .order('recorded_at', { ascending: false })
      .order('id', { ascending: false })
      .range(q.offset, q.offset + q.limit - 1);

    if (error) return { ok: false, message: translatePostgrestError(error) };
    return { ok: true, data: toMeasurements(data) };
  } catch {
    return { ok: false, message: GENERIC_ERROR };
  }
}

export async function fetchDashboardMeasurements(
  deviceId: string,
): Promise<ServiceResult<RealDashboardData>> {
  try {
    const supabase = getSupabaseClient();
    const base = () => supabase.from('measurements').select(COLUMNS).eq('device_id', deviceId);

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