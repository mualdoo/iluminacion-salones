import { getSupabaseClient } from '@/services/supabase/client';
import type { ConfigurationInput } from '@/types/control';
import type { Configuration } from '@/types/database';
import type { ServiceResult } from '@/types/service';
import { GENERIC_ERROR, translatePostgrestError } from '@/utils/supabaseErrors';

const COLUMNS = 'id, device_id, light_threshold, automatic_mode, created_at, updated_at';

type Row = {
  id: string;
  device_id: string;
  light_threshold: number | string;
  automatic_mode: boolean;
  created_at: string;
  updated_at: string;
};

const toConfiguration = (row: Row): Configuration => ({
  id: row.id,
  device_id: row.device_id,
  light_threshold: Number(row.light_threshold),
  automatic_mode: row.automatic_mode,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

// Devuelve null (ok) si el dispositivo no tiene fila de configuración.
export async function fetchConfiguration(
  deviceId: string,
): Promise<ServiceResult<Configuration | null>> {
  try {
    const { data, error } = await getSupabaseClient()
      .from('configurations')
      .select(COLUMNS)
      .eq('device_id', deviceId)
      .maybeSingle();
    if (error) return { ok: false, message: translatePostgrestError(error) };
    return { ok: true, data: data ? toConfiguration(data as unknown as Row) : null };
  } catch {
    return { ok: false, message: GENERIC_ERROR };
  }
}

// Solo se envían light_threshold y automatic_mode: es lo único que permiten los privilegios de columna.
export async function updateConfiguration(
  deviceId: string,
  input: ConfigurationInput,
): Promise<ServiceResult<Configuration>> {
  try {
    const { data, error } = await getSupabaseClient()
      .from('configurations')
      .update({
        light_threshold: input.light_threshold,
        automatic_mode: input.automatic_mode,
      })
      .eq('device_id', deviceId)
      .select(COLUMNS)
      .maybeSingle();
    if (error) return { ok: false, message: translatePostgrestError(error) };
    if (!data) {
      return { ok: false, message: 'No se encontró la configuración de este dispositivo.' };
    }
    return { ok: true, data: toConfiguration(data as unknown as Row) };
  } catch {
    return { ok: false, message: GENERIC_ERROR };
  }
}