import { ANALYTICS_MAX_ROWS } from '@/constants/analytics';
import { COMMAND_TYPE_SET_LIGHT } from '@/constants/control';
import { MEASUREMENT_COLUMNS, toMeasurements } from '@/services/measurements/measurementService';
import { getSupabaseClient } from '@/services/supabase/client';
import type { Command, CommandStatus, Measurement } from '@/types/database';
import type { ServiceResult } from '@/types/service';
import { GENERIC_ERROR, translatePostgrestError } from '@/utils/supabaseErrors';

const COMMAND_COLUMNS = 'id, device_id, command_type, value, status, created_at, executed_at';

type CommandRow = {
  id: string;
  device_id: string;
  command_type: string;
  value: string | number | null;
  status: CommandStatus;
  created_at: string;
  executed_at: string | null;
};

const toCommand = (row: CommandRow): Command => ({
  id: row.id,
  device_id: row.device_id,
  command_type: row.command_type,
  value: row.value === null ? null : String(row.value),
  status: row.status,
  created_at: row.created_at,
  executed_at: row.executed_at,
});

/**
 * Mediciones del periodo (las más recientes, hasta ANALYTICS_MAX_ROWS) y comandos de luz
 * ejecutados dentro del mismo periodo.
 */
export async function fetchAnalyticsData(
  deviceId: string,
  sinceIso: string,
): Promise<ServiceResult<{ measurements: Measurement[]; commands: Command[] }>> {
  try {
    const supabase = getSupabaseClient();

    const [measurements, commands] = await Promise.all([
      supabase
        .from('measurements')
        .select(MEASUREMENT_COLUMNS)
        .eq('device_id', deviceId)
        .gte('recorded_at', sinceIso)
        .order('recorded_at', { ascending: false })
        .limit(ANALYTICS_MAX_ROWS),
      supabase
        .from('commands')
        .select(COMMAND_COLUMNS)
        .eq('device_id', deviceId)
        .eq('command_type', COMMAND_TYPE_SET_LIGHT)
        .eq('status', 'executed')
        .gte('executed_at', sinceIso)
        .order('executed_at', { ascending: false })
        .limit(ANALYTICS_MAX_ROWS),
    ]);

    const failure = measurements.error ?? commands.error;
    if (failure) return { ok: false, message: translatePostgrestError(failure) };

    return {
      ok: true,
      data: {
        measurements: toMeasurements(measurements.data),
        commands: ((commands.data ?? []) as unknown as CommandRow[]).map(toCommand),
      },
    };
  } catch {
    return { ok: false, message: GENERIC_ERROR };
  }
}