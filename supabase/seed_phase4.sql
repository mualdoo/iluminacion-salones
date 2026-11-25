-- =====================================================================
-- FASE 4 · Datos de prueba (solo desarrollo)
-- Se ejecuta en el SQL Editor de Supabase (corre como administrador, por
-- eso puede insertar en measurements aunque la app solo tenga lectura).
--
-- Antes: registra al menos un dispositivo desde la app (pestaña Dispositivos).
-- Ejecútalo UNA vez: si lo repites, las mediciones se duplican.
-- =====================================================================
do $$
declare
  -- Opcional: correo del usuario dueño del dispositivo. Con null se usa
  -- el primer dispositivo registrado (el más antiguo) de todo el proyecto.
  v_user_email text := null;   -- ejemplo: 'tu@correo.com'
  v_device_id  uuid;
begin
  select d.id
    into v_device_id
  from public.devices d
  join auth.users u on u.id = d.user_id
  where v_user_email is null or lower(u.email) = lower(v_user_email)
  order by d.created_at asc
  limit 1;

  if v_device_id is null then
    raise exception 'No hay dispositivos registrados. Crea uno desde la app (pestaña Dispositivos) y vuelve a ejecutar este script.';
  end if;

  -- Iluminación: 24 mediciones, una cada 5 minutos (últimas 2 horas)
  insert into public.measurements (device_id, measurement_type, value, recorded_at)
  select v_device_id,
         'light',
         round(least(1000, greatest(0,
           500 + 300 * sin((g / 3.0)::double precision) + (random() * 60 - 30)
         ))),
         now() - (g * interval '5 minutes')
  from generate_series(0, 23) as g;

  -- Movimiento: 20 lecturas, una cada 3 minutos (0 = sin movimiento, 1 = movimiento)
  -- La más reciente es 1 para que el salón figure como ocupado.
  insert into public.measurements (device_id, measurement_type, value, recorded_at)
  select v_device_id,
         'motion',
         case when g % 5 in (0, 1, 3) then 1 else 0 end,
         now() - (g * interval '3 minutes') - interval '30 seconds'
  from generate_series(0, 19) as g;

  -- Mediciones más antiguas, para que los filtros de rango se noten
  insert into public.measurements (device_id, measurement_type, value, recorded_at) values
    (v_device_id, 'light',  640, now() - interval '5 hours'),
    (v_device_id, 'light',  210, now() - interval '9 hours'),
    (v_device_id, 'light',  880, now() - interval '30 hours'),
    (v_device_id, 'light',  350, now() - interval '3 days'),
    (v_device_id, 'light',  720, now() - interval '5 days'),
    (v_device_id, 'motion', 1,   now() - interval '8 hours'),
    (v_device_id, 'motion', 0,   now() - interval '26 hours'),
    (v_device_id, 'motion', 1,   now() - interval '4 days');

  -- El dispositivo aparece conectado
  update public.devices
     set status = 'online',
         last_seen_at = now()
   where id = v_device_id;

  raise notice 'Mediciones de prueba insertadas para el dispositivo %', v_device_id;
end $$;

-- Limpieza opcional (borra TODAS las mediciones del dispositivo; úsala solo en desarrollo):
-- delete from public.measurements where device_id = '<UUID_DEL_DISPOSITIVO>';