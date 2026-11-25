-- =====================================================================
-- FASE 2 · Esquema inicial
-- =====================================================================

-- ---------- Función genérica: updated_at ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- Tablas ----------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.devices (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  name         text not null check (char_length(btrim(name)) between 1 and 100),
  description  text check (description is null or char_length(description) <= 500),
  status       text not null default 'pending'
                 check (status in ('online', 'offline', 'pending')),
  last_seen_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index devices_user_id_idx on public.devices (user_id);

create table public.measurements (
  id               uuid primary key default gen_random_uuid(),
  device_id        uuid not null references public.devices (id) on delete cascade,
  measurement_type text not null check (measurement_type in ('light', 'motion')),
  value            double precision not null,
  recorded_at      timestamptz not null default now(),
  -- movimiento = booleano almacenado como 0 o 1
  constraint measurements_motion_is_boolean
    check (measurement_type <> 'motion' or value in (0, 1))
);
create index measurements_device_type_time_idx
  on public.measurements (device_id, measurement_type, recorded_at desc);

create table public.configurations (
  id              uuid primary key default gen_random_uuid(),
  device_id       uuid not null unique references public.devices (id) on delete cascade,
  light_threshold double precision not null default 500 check (light_threshold >= 0),
  automatic_mode  boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table public.commands (
  id           uuid primary key default gen_random_uuid(),
  device_id    uuid not null references public.devices (id) on delete cascade,
  command_type text not null check (char_length(btrim(command_type)) between 1 and 50),
  value        text,
  status       text not null default 'pending'
                 check (status in ('pending', 'executed', 'failed')),
  created_at   timestamptz not null default now(),
  executed_at  timestamptz
);
create index commands_device_status_time_idx
  on public.commands (device_id, status, created_at desc);

-- ---------- Triggers: updated_at ----------
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger devices_set_updated_at
  before update on public.devices
  for each row execute function public.set_updated_at();

create trigger configurations_set_updated_at
  before update on public.configurations
  for each row execute function public.set_updated_at();

-- ---------- Trigger: crear perfil al registrarse ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Trigger: configuración por defecto al crear un dispositivo ----------
create or replace function public.handle_new_device()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.configurations (device_id) values (new.id);
  return new;
end;
$$;

create trigger on_device_created
  after insert on public.devices
  for each row execute function public.handle_new_device();

-- Las funciones de trigger no deben poder llamarse como RPC desde la API
revoke execute on function public.handle_new_user()   from public, anon, authenticated;
revoke execute on function public.handle_new_device() from public, anon, authenticated;

-- ---------- RLS ----------
alter table public.profiles       enable row level security;
alter table public.devices        enable row level security;
alter table public.measurements   enable row level security;
alter table public.configurations enable row level security;
alter table public.commands       enable row level security;

-- ---------- Privilegios mínimos (defensa en profundidad) ----------
revoke all on table
  public.profiles, public.devices, public.measurements,
  public.configurations, public.commands
from anon, authenticated;

grant select on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;

grant select, delete on public.devices to authenticated;
grant insert (user_id, name, description) on public.devices to authenticated;
grant update (name, description) on public.devices to authenticated;

grant select on public.measurements to authenticated;

grant select on public.configurations to authenticated;
grant update (light_threshold, automatic_mode) on public.configurations to authenticated;

grant select, delete on public.commands to authenticated;
grant insert (device_id, command_type, value) on public.commands to authenticated;

-- ---------- Políticas: profiles ----------
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- ---------- Políticas: devices ----------
create policy "devices_select_own" on public.devices
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "devices_insert_own" on public.devices
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "devices_update_own" on public.devices
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "devices_delete_own" on public.devices
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- ---------- Políticas: measurements (solo lectura para el usuario) ----------
create policy "measurements_select_own_devices" on public.measurements
  for select to authenticated
  using (exists (
    select 1 from public.devices d
    where d.id = measurements.device_id
      and d.user_id = (select auth.uid())
  ));

-- ---------- Políticas: configurations ----------
create policy "configurations_select_own_devices" on public.configurations
  for select to authenticated
  using (exists (
    select 1 from public.devices d
    where d.id = configurations.device_id
      and d.user_id = (select auth.uid())
  ));

create policy "configurations_update_own_devices" on public.configurations
  for update to authenticated
  using (exists (
    select 1 from public.devices d
    where d.id = configurations.device_id
      and d.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.devices d
    where d.id = configurations.device_id
      and d.user_id = (select auth.uid())
  ));

-- ---------- Políticas: commands ----------
create policy "commands_select_own_devices" on public.commands
  for select to authenticated
  using (exists (
    select 1 from public.devices d
    where d.id = commands.device_id
      and d.user_id = (select auth.uid())
  ));

create policy "commands_insert_own_devices" on public.commands
  for insert to authenticated
  with check (exists (
    select 1 from public.devices d
    where d.id = commands.device_id
      and d.user_id = (select auth.uid())
  ));

create policy "commands_delete_own_devices" on public.commands
  for delete to authenticated
  using (exists (
    select 1 from public.devices d
    where d.id = commands.device_id
      and d.user_id = (select auth.uid())
  ));