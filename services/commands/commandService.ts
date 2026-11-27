import { COMMAND_TYPE_SET_LIGHT } from '@/constants/control';
import { getSupabaseClient } from '@/services/supabase/client';
import type { LampCommandValue } from '@/types/control';
import type { Command, CommandStatus } from '@/types/database';
import type { ServiceResult } from '@/types/service';
import { GENERIC_ERROR, translatePostgrestError } from '@/utils/supabaseErrors';

const COLUMNS = 'id, device_id, command_type, value, status, created_at, executed_at';

type Row = {
  id: string;
  device_id: string;
  command_type: string;
  value: string | number | null;
  status: CommandStatus;
  created_at: string;
  executed_at: string | null;
};

const toCommand = (row: Row): Command => ({
  id: row.id,
  device_id: row.device_id,
  command_type: row.command_type,
  value: row.value === null ? null : String(row.value),
  status: row.status,
  created_at: row.created_at,
  executed_at: row.executed_at,
});

export async function fetchCommands(
  deviceId: string,
  limit: number,
): Promise<ServiceResult<Command[]>> {
  try {
    const { data, error } = await getSupabaseClient()
      .from('commands')
      .select(COLUMNS)
      .eq('device_id', deviceId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) return { ok: false, message: translatePostgrestError(error) };
    return { ok: true, data: ((data ?? []) as unknown as Row[]).map(toCommand) };
  } catch {
    return { ok: false, message: GENERIC_ERROR };
  }
}

// No se envía status: la base de datos lo crea como 'pending'.
export async function insertLampCommand(
  deviceId: string,
  value: LampCommandValue,
): Promise<ServiceResult<Command>> {
  try {
    const { data, error } = await getSupabaseClient()
      .from('commands')
      .insert({ device_id: deviceId, command_type: COMMAND_TYPE_SET_LIGHT, value })
      .select(COLUMNS)
      .single();
    if (error) return { ok: false, message: translatePostgrestError(error) };
    return { ok: true, data: toCommand(data as unknown as Row) };
  } catch {
    return { ok: false, message: GENERIC_ERROR };
  }
}

// Solo se cancelan (eliminan) comandos que sigan pendientes.
export async function deleteCommandById(id: string): Promise<ServiceResult<null>> {
  try {
    const { data, error } = await getSupabaseClient()
      .from('commands')
      .delete()
      .eq('id', id)
      .eq('status', 'pending')
      .select('id');
    if (error) return { ok: false, message: translatePostgrestError(error) };
    if (!data || data.length === 0) {
      return { ok: false, message: 'No se pudo cancelar: el comando ya no está pendiente.' };
    }
    return { ok: true, data: null };
  } catch {
    return { ok: false, message: GENERIC_ERROR };
  }
}