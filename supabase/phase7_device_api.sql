-- =====================================================================
-- FASE 7: API de dispositivos para ESP32
-- Migración incremental. Se ejecuta DESPUÉS de schema.sql.
-- Se puede ejecutar más de una vez sin borrar datos ni tokens.
-- =====================================================================

begin;

-- 1) Credenciales: tabla aparte, invisible para la app --------------------
create table if not exists public.device_credentials (
  device_id  uuid primary key references public.devices(id) on delete cascade,
  token_hash text not null check (token_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  rotated_at timestamptz not null default now()
);

-- RLS activado y SIN políticas: anon y authenticated no pueden ver nada.
alter table public.device_credentials enable row level security;
revoke all on table public.device_credentials from public, anon, authenticated;

-- 2) Generar / rotar token (solo SQL Editor) ------------------------------
-- El esquema "private" no se expone por la API REST.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.rotate_device_token(p_device_id uuid)
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_token text;
begin
  if not exists (select 1 from public.devices where id = p_device_id) then
    raise exception 'El dispositivo % no existe', p_device_id;
  end if;

  -- Dos UUID v4: 64 caracteres hexadecimales aleatorios.
  v_token := replace(gen_random_uuid()::text, '-', '')
          || replace(gen_random_uuid()::text, '-', '');

  insert into public.device_credentials (device_id, token_hash)
  values (p_device_id, encode(sha256(convert_to(v_token, 'UTF8')), 'hex'))
  on conflict (device_id) do update
    set token_hash = excluded.token_hash,
        rotated_at = now();

  -- Única vez que el token existe en claro: solo se guarda su hash.
  return v_token;
end;
$$;

revoke all on function private.rotate_device_token(uuid) from public, anon, authenticated;

-- 3) Sincronización atómica (solo la Edge Function) -----------------------
create or replace function public.device_sync(
  p_device_id    uuid,
  p_token_hash   text,
  p_light        integer default null,
  p_motion       integer default null,
  p_executed_ids uuid[]  default '{}',
  p_failed_ids   uuid[]  default '{}'
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_config   jsonb;
  v_commands jsonb;
  v_last     text;
begin
  -- a) Autenticación. NULL = rechazado (no revela si el device existe).
  if not exists (
    select 1 from public.device_credentials c
    where c.device_id = p_device_id and c.token_hash = p_token_hash
  ) then
    return null;
  end if;

  -- b) Presencia
  update public.devices
     set status = 'online', last_seen_at = now()
   where id = p_device_id;

  -- c) Lecturas (la hora la pone el servidor)
  if p_light is not null then
    if p_light < 0 or p_light > 1000 then
      raise exception 'light fuera de rango' using errcode = '22023';
    end if;
    insert into public.measurements (device_id, measurement_type, value, recorded_at)
    values (p_device_id, 'light', p_light, now());
  end if;

  if p_motion is not null then
    if p_motion not in (0, 1) then
      raise exception 'motion debe ser 0 o 1' using errcode = '22023';
    end if;
    insert into public.measurements (device_id, measurement_type, value, recorded_at)
    values (p_device_id, 'motion', p_motion, now());
  end if;

  -- d) Confirmaciones. Solo comandos PROPIOS y todavía pendientes,
  --    así que reenviar la misma confirmación no cambia nada.
  update public.commands
     set status = 'executed', executed_at = now()
   where device_id = p_device_id and status = 'pending'
     and id = any(coalesce(p_executed_ids, '{}'));

  update public.commands
     set status = 'failed', executed_at = now()
   where device_id = p_device_id and status = 'pending'
     and id = any(coalesce(p_failed_ids, '{}'));

  -- e) Respuesta
  select jsonb_build_object(
           'light_threshold', cf.light_threshold,
           'automatic_mode',  cf.automatic_mode)
    into v_config
    from public.configurations cf
   where cf.device_id = p_device_id;

  if v_config is null then
    raise exception 'El dispositivo no tiene configuración';
  end if;

  select coalesce(jsonb_agg(
           jsonb_build_object('id', q.id, 'command_type', q.command_type, 'value', q.value)
           order by q.created_at, q.id), '[]'::jsonb)
    into v_commands
    from (
      select id, command_type, value, created_at
        from public.commands
       where device_id = p_device_id and status = 'pending'
       order by created_at, id
       limit 10
    ) q;

  -- Permite recuperar el estado manual después de reiniciar el ESP32.
  select value into v_last
    from public.commands
   where device_id = p_device_id and status = 'executed' and command_type = 'set_light'
   order by executed_at desc nulls last, created_at desc, id desc
   limit 1;

  return jsonb_build_object(
    'config', v_config,
    'commands', v_commands,
    'last_executed_value', v_last);
end;
$$;

revoke all on function public.device_sync(uuid, text, integer, integer, uuid[], uuid[])
  from public, anon, authenticated;
grant execute on function public.device_sync(uuid, text, integer, integer, uuid[], uuid[])
  to service_role;

-- Permisos mínimos que necesita la función cuando corre como service_role
grant usage on schema public to service_role;
grant select on public.device_credentials, public.configurations to service_role;
grant select, update on public.devices, public.commands to service_role;
grant insert on public.measurements to service_role;

create index if not exists commands_device_status_created_idx
  on public.commands (device_id, status, created_at);

commit;

-- 4) Marcar "offline" automáticamente ------------------------------------
create extension if not exists pg_cron;

-- cron.schedule con el mismo nombre reemplaza el trabajo anterior.
select cron.schedule(
  'mark-stale-devices-offline',
  '* * * * *',
  $job$
    update public.devices
       set status = 'offline'
     where status = 'online'
       and (last_seen_at is null or last_seen_at < now() - interval '2 minutes');
  $job$
);
