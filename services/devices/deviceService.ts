import { getSupabaseClient } from '@/services/supabase/client';
import type { Device } from '@/types/database';
import type { DeviceInput, ServiceResult } from '@/types/service';
import { GENERIC_ERROR, translatePostgrestError } from '@/utils/supabaseErrors';

const fail = (error: { code?: string; message?: string }): { ok: false; message: string } => ({
  ok: false,
  message: translatePostgrestError(error),
});

const failGeneric = (): { ok: false; message: string } => ({ ok: false, message: GENERIC_ERROR });

function normalize(input: DeviceInput) {
  return {
    name: input.name.trim(),
    description: input.description.trim() || null,
  };
}

// RLS garantiza que solo se devuelven los dispositivos del usuario autenticado.
export async function fetchDevices(): Promise<ServiceResult<Device[]>> {
  try {
    const { data, error } = await getSupabaseClient()
      .from('devices')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) return fail(error);
    return { ok: true, data: (data ?? []) as unknown as Device[] };
  } catch {
    return failGeneric();
  }
}

export async function insertDevice(userId: string, input: DeviceInput): Promise<ServiceResult<Device>> {
  try {
    const { data, error } = await getSupabaseClient()
      .from('devices')
      .insert({ user_id: userId, ...normalize(input) })
      .select('*')
      .single();
    if (error) return fail(error);
    return { ok: true, data: data as unknown as Device };
  } catch {
    return failGeneric();
  }
}

// Solo se envían name y description: es lo único que permiten los privilegios de columna.
export async function updateDeviceById(id: string, input: DeviceInput): Promise<ServiceResult<Device>> {
  try {
    const { data, error } = await getSupabaseClient()
      .from('devices')
      .update(normalize(input))
      .eq('id', id)
      .select('*')
      .single();
    if (error) return fail(error);
    return { ok: true, data: data as unknown as Device };
  } catch {
    return failGeneric();
  }
}

export async function deleteDeviceById(id: string): Promise<ServiceResult<null>> {
  try {
    const { error } = await getSupabaseClient().from('devices').delete().eq('id', id);
    if (error) return fail(error);
    return { ok: true, data: null };
  } catch {
    return failGeneric();
  }
}