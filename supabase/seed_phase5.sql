-- =====================================================================
-- FASE 5 · Simular la respuesta del dispositivo (solo desarrollo)
-- Se ejecuta en el SQL Editor de Supabase (corre como administrador). La app
-- no puede cambiar status ni executed_at: eso lo hará el ESP32 en la Fase 7.
--
-- Antes: envía un comando desde la pestaña Control (queda 'pending').
-- =====================================================================
do $$
declare
  v_user_email   text := null;         -- opcional: 'tu@correo.com'
  v_final_status text := 'executed';   -- 'executed' o 'failed'
  v_command_id   uuid;
  v_device_id    uuid;
begin
  select c.id, c.device_id
    into v_command_id, v_device_id
  from public.commands c
  join public.devices d on d.id = c.device_id
  join auth.users u on u.id = d.user_id
  where c.status = 'pending'
    and (v_user_email is null or lower(u.email) = lower(v_user_email))
  order by c.created_at desc
  limit 1;

  if v_command_id is null then
    raise exception 'No hay comandos pendientes. Envía uno desde la pestaña Control y vuelve a ejecutar.';
  end if;

  update public.commands
     set status = v_final_status,
         executed_at = now()
   where id = v_command_id;

  -- El dispositivo figura en línea (necesario para que se evalúen las alertas de luz y ocupación)
  update public.devices
     set status = 'online',
         last_seen_at = now()
   where id = v_device_id;

  raise notice 'Comando % marcado como %', v_command_id, v_final_status;
end $$;

-- ---------------------------------------------------------------------
-- Probar la alerta "comandos pendientes sin ejecutar" (> 2 minutos):
-- envía un comando desde la app y retrasa su fecha de creación.
-- Descomenta, sustituye el UUID y ejecuta:
-- ---------------------------------------------------------------------
-- update public.commands
--    set created_at = now() - interval '5 minutes'
--  where id = '<UUID_DEL_COMANDO_PENDIENTE>';