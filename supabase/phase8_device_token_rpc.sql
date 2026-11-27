-- =====================================================================
-- FASE 8: obtener el token del dispositivo desde la app
-- Ejecutar DESPUÉS de phase7_device_api.sql. Se puede repetir sin riesgo.
--
-- Devuelve:
--   token (64 hex) -> el dispositivo no tenía credencial y se acaba de crear
--   NULL           -> ya existe una credencial; solo hay hash y NO se modifica
-- =====================================================================
begin;

create extension if not exists pgcrypto with schema extensions;

create or replace function public.get_or_create_device_token(p_device_id uuid)
returns text
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_user  uuid := auth.uid();
  v_token text;
begin
  -- Propiedad estricta. Mismo error si no existe o si es de otro usuario.
  if v_user is null or not exists (
    select 1 from public.devices d
    where d.id = p_device_id and d.user_id = v_user
  ) then
    raise exception 'No autorizado para este dispositivo' using errcode = '42501';
  end if;

  -- 32 bytes = 64 caracteres hex: el formato que exige esp32-sync.
  v_token := encode(gen_random_bytes(32), 'hex');

  -- DO NOTHING: nunca reemplaza (no rota) una credencial existente,
  -- ni siquiera con dos llamadas simultáneas.
  insert into public.device_credentials (device_id, token_hash)
  values (p_device_id, encode(sha256(convert_to(v_token, 'UTF8')), 'hex'))
  on conflict (device_id) do nothing;

  if not found then
    return null;
  end if;

  return v_token;
end;
$$;

revoke all on function public.get_or_create_device_token(uuid)
  from public, anon, authenticated, service_role;
grant execute on function public.get_or_create_device_token(uuid) to authenticated;

commit;

-- Para que la API REST vea la función de inmediato.
notify pgrst, 'reload schema';
