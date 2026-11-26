# Fase 7: ESP32 + Supabase

## 0. Qué está verificado y qué falta

| Pieza | Prueba hecha | Pendiente |
|---|---|---|
| SQL (secciones 1-3) | PostgreSQL 16 local con un **esquema mínimo simulado**: ejecutado 2 veces; tokens, aislamiento entre dispositivos, orden y confirmación de comandos, bloqueo a `authenticated` | Ejecutarlo contra tu `schema.sql` real |
| SQL (sección 4, `pg_cron`) | No probada | Ejecutar en Supabase |
| Edge Function | Node, con Deno y el cliente simulados: 10 casos HTTP | Revisión de tipos en Deno, despliegue real |
| Firmware | Compilado con `g++`, ArduinoJson 7.4.3 real y hardware/red simulados; probados automático, histéresis, manual, reintentos y recuperación | **Compilar para ESP32** y probar en hardware. Las tareas FreeRTOS y TLS no se probaron |

**Aclaración sobre librerías:** `ArduinoJson` no viene en el core ESP32; hay que instalarla (versión 7).

## 1. Flujo de datos

```text
 LDR ─┐                    HTTPS POST /functions/v1/esp32-sync
 PIR ─┼─> ESP32  ───────── x-device-token + {device_id, light, motion, acks} ──┐
 LED <┘     ^                                                                  v
            │                                              Edge Function: valida formato,
            │                                              calcula SHA-256 del token
            │                                                                  │ secret key
            │                                                                  v
            │                                     PostgreSQL device_sync() (una transacción)
            │                                       1. compara el hash   4. cierra comandos
            │                                       2. online/last_seen  5. lee config y
            │                                       3. inserta lecturas     pendientes
            └──────── {config, commands[], last_executed_value} <──────────────┘

 App Expo ── JWT del usuario + RLS ──> PostgreSQL (lee mediciones; escribe config y comandos)
 pg_cron (cada minuto) ──> online → offline si last_seen_at tiene más de 2 min
```

**Seguridad:** el ESP32 solo guarda el token de su dispositivo. La base guarda únicamente el hash, en una tabla sin acceso para la app. La secret key vive solo en la Edge Function (usa `SUPABASE_SECRET_KEYS` y, si no existe, `service_role`; Supabase anunció que las claves antiguas quedan obsoletas a finales de 2026). Quien tenga acceso físico al ESP32 podría extraer su token y la contraseña WiFi; si pasa, rota el token.

**Desconexión:** `pg_cron` cambia `status` a `offline`. Como corre cada minuto, tarda entre 2 y 3 minutos. La siguiente sincronización lo regresa a `online`.

## 2. Archivos

Copia el contenido del ZIP en la raíz de `iluminacion-salones/`.

```text
supabase/phase7_device_api.sql
supabase/functions/esp32-sync/index.ts
supabase/config.fragment.toml
firmware/esp32_iluminacion/{esp32_iluminacion.ino, secrets.example.h, platformio.ini, .gitignore}
docs/FASE7_GUIA.md
```

## 3. Base de datos

1. Supabase → **SQL Editor** → pega todo `phase7_device_api.sql` → **Run**.
2. Si falla `create extension pg_cron`, actívalo en **Integrations → Cron** y ejecuta la sección 4. Las secciones 1-3 ya quedan confirmadas por su `commit`.
3. Verifica:
   ```sql
   select jobname, schedule, active from cron.job;
   ```
4. En la app crea un dispositivo **nuevo** (así no mezclas datos de los seeds). Obtén su ID y genera el token:
   ```sql
   select id, name from public.devices order by created_at desc;
   select private.rotate_device_token('UUID_DEL_DISPOSITIVO');
   ```
   Copia el token: solo se muestra esa vez. Volver a ejecutarlo invalida el anterior. No lo guardes en snippets ni capturas.

## 4. Edge Function (Debian)

Requiere Node 20 o posterior. Desde la raíz del proyecto:

```bash
pnpm add -D supabase
# Si pnpm avisa que bloqueó scripts de supabase: pnpm approve-builds
[ -f supabase/config.toml ] || pnpm exec supabase init
grep -q 'functions.esp32-sync' supabase/config.toml || cat supabase/config.fragment.toml >> supabase/config.toml
```

Si ya existía una sección `[functions.esp32-sync]`, comprueba que tenga `verify_jwt = false`.

```bash
pnpm exec supabase login
pnpm exec supabase link --project-ref TU_PROJECT_REF
pnpm exec supabase functions deploy esp32-sync --no-verify-jwt --use-api
```

`--use-api` empaqueta en el servidor, sin Docker. No hay que subir secretos: Supabase los inyecta en la función. `--no-verify-jwt` no la deja sin protección: la función exige el token del dispositivo.

Prueba sin hardware (esto **inserta** dos lecturas reales):

```bash
read -r  -p "Project ref: " REF
read -r  -p "Device ID: " DEVICE_ID
read -rs -p "Token: " TOKEN; echo
curl -i "https://$REF.supabase.co/functions/v1/esp32-sync" \
  -H "Content-Type: application/json" -H "x-device-token: $TOKEN" \
  -d "{\"device_id\":\"$DEVICE_ID\",\"light\":420,\"motion\":0}"
unset TOKEN
```

Esperado: `200` con `config`, `commands` y `last_executed_value`. Con un token incorrecto: `401`. Ante un `500`, revisa **Edge Functions → esp32-sync → Logs**.

## 5. Ajuste en la app

**No hace falta modificar pantallas ni servicios:** el token se genera en el SQL Editor y el estado `offline` lo resuelve la base.

Un ajuste de configuración: si tu `tsconfig.json` incluye `**/*.ts`, TypeScript intentará revisar la función de Deno y marcará errores. Agrega la exclusión conservando lo que ya tengas (no incluyo el archivo completo porque no tengo el original):

```json
"exclude": ["node_modules", "supabase/functions"]
```

No revisé el código de la app. Si un cambio de estado o una lectura nueva no aparece hasta recargar, tus hooks no usan Realtime ni consultas periódicas.

## 6. Conexiones físicas (ESP32 DevKit V1 / WROOM-32)

Conecta todo con el USB desconectado.

| Componente | Conexión |
|---|---|
| LDR | Una pata a **3V3**; la otra al nodo **GPIO34** |
| Resistencia 10 kΩ | Del nodo **GPIO34** a **GND** |
| PIR HC-SR501 | VCC → **VIN/5V** (alimentado por USB), GND → **GND**, OUT → **GPIO27** |
| LED | **GPIO26** → resistencia **220-330 Ω** → ánodo (pata larga); cátodo → **GND** |

```text
3V3 ── LDR ──┬── GPIO34          GPIO26 ── 330Ω ──▶|── GND
             └── 10kΩ ── GND                       LED
VIN ── VCC [PIR] GND ── GND
             OUT ── GPIO27
```

- Nunca apliques 5 V a un GPIO. La salida del HC-SR501 suele ser de 3.3 V; mídela si usas otro módulo.
- El orden de pines del PIR cambia entre módulos: confírmalo en la serigrafía.
- PIR: jumper en **H** (redisparo) y potenciómetro de tiempo al mínimo.
- **Aleja el LED del LDR o pon una barrera opaca.** Si el LED ilumina el sensor, puede encenderse y apagarse en ciclo. La histéresis (40 u.r.) y el tiempo mínimo (3 s) reducen el problema, pero no lo eliminan.

## 7. Cargar el firmware

Primero:

```bash
cd firmware/esp32_iluminacion
cp secrets.example.h secrets.h   # edítalo; WiFi de 2.4 GHz sin portal cautivo
sudo usermod -aG dialout $USER   # cierra sesión y vuelve a entrar
```

**PlatformIO** (CLI o extensión de VS Code):

```bash
pio run
pio run -t upload
pio device monitor -b 115200
```

**Arduino IDE:** instala el paquete **esp32 by Espressif Systems** y la librería **ArduinoJson** (Benoit Blanchon, 7.x); abre el `.ino`, elige **ESP32 Dev Module** y el puerto (`/dev/ttyUSB0` o `/dev/ttyACM0`).

Si la carga se queda en `Connecting...`, mantén presionado **BOOT** hasta que empiece. Si no aparece el puerto, prueba con un cable USB de datos.

## 8. Calibración

1. Observa `raw=` en el Monitor Serial.
2. Tapa el LDR y anota el valor → `LDR_RAW_DARK`.
3. Ilumínalo con la luz máxima esperada y el LED del prototipo apagado → `LDR_RAW_BRIGHT`.
4. Actualiza las constantes y vuelve a cargar. La escala es relativa (u.r.), no son lux.
5. Elige un umbral en la app entre las lecturas de "salón oscuro" y "salón iluminado". Evita valores mayores de 960: con la histéresis de 40, la luz nunca podría apagar el LED.

## 9. Pruebas en hardware real

Ten abiertos el Monitor Serial, el Table Editor y la app en Expo Go.

| # | Acción | Resultado esperado |
|---|---|---|
| 1 | Encender el ESP32 | `[WIFI] Conectado`, `[NET] HTTP 200`; `status=online`, `last_seen_at` reciente |
| 2 | Esperar 60 s sin moverte frente al PIR | `[PIR] Sensor estabilizado`. Durante la espera solo se envía `light` |
| 3 | Tapar y destapar el LDR | Cambia `luz=`; a los ~10 s hay una fila nueva en `measurements` y en la app |
| 4 | Moverte y luego quedarte quieto | `mov=1` y después `0`, con envío anticipado |
| 5 | AUTO, LDR tapado, con movimiento | LED encendido |
| 6 | Sin movimiento (tras el retardo del PIR) | LED apagado |
| 7 | Movimiento con mucha luz | LED apagado |
| 8 | Cambiar el umbral en la app | `[CFG]` en ≤10 s aproximadamente |
| 9 | Pasar a MANUAL y enviar ON, luego OFF | LED obedece; en `commands`: `executed` con `executed_at` |
| 10 | Reiniciar en MANUAL con último comando ON y sin pendientes | `estado recuperado`, LED encendido |
| 11 | Apagar el router | `[WIFI] Conexion perdida`; sensores y LED en AUTO siguen funcionando; `offline` en 2-3 min |
| 12 | Encender el router | Reconecta solo y vuelve a `online` |
| 13 | Poner un token incorrecto | `HTTP 401`; no hay filas nuevas |

Para probar `failed`: estando en AUTO, inserta un comando desde el SQL Editor y debe terminar en `failed`:

```sql
insert into public.commands (device_id, command_type, value, status)
values ('UUID_DEL_DISPOSITIVO', 'set_light', 'on', 'pending');
```

```sql
select measurement_type, value, recorded_at from public.measurements
where device_id = 'UUID_DEL_DISPOSITIVO' order by recorded_at desc limit 10;
```

## 10. Comportamiento y límites

- Un comando tarda hasta ~10 s en llegar, porque el ESP32 consulta periódicamente. Si la app borra un comando que el ESP32 ya recibió, puede ejecutarse de todos modos.
- Si falla el envío de una confirmación, se reintenta sin ejecutar el comando otra vez. Si el ESP32 se reinicia antes de confirmar, el comando llega de nuevo (repetir ON u OFF no causa problema).
- Sin red tras un reinicio, usa AUTO con umbral 500. Con la red caída, conserva la última configuración. No guarda lecturas sin conexión.
- Un pulso de movimiento que empiece y termine mientras hay una petición en curso o en la pausa entre envíos puede no registrarse en la base. El LED sí reacciona según sus reglas.
- **Volumen:** cada 10 s se generan unas 17,000 filas al día por dispositivo, más los eventos. Revisa que historial y estadísticas no se queden cortos por el límite de filas de la API (1,000 por defecto). Para reducirlo, sube `TELEMETRY_MS` a 15000 (también aumenta la latencia de comandos).
- **TLS:** `setInsecure()` no verifica el servidor. Antes de un uso real, configura `ROOT_CA`.

## Referencias
- https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys
- https://supabase.com/docs/guides/functions/deploy
- https://supabase.com/docs/guides/functions/function-configuration
- https://supabase.com/docs/guides/local-development/cli/getting-started
- https://github.com/bblanchon/ArduinoJson/releases
