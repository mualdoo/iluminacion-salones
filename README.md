# iluminacion-salones

Aplicación móvil Android para **monitorear y controlar la iluminación de salones de clases**. Un ESP32 mide la luz (fotorresistor) y el movimiento (sensor PIR), controla un LED y se comunica con Supabase; la app muestra los datos, permite configurar el umbral y el modo de operación, y enviar comandos a la luminaria.

Repositorio: <https://github.com/mualdoo/iluminacion-salones>

## Características

- Registro, inicio de sesión y persistencia de sesión (Supabase Auth).
- Gestión de dispositivos (salones) y consulta de sus credenciales para el ESP32.
- Panel con nivel de iluminación, detección de movimiento, estado de la luminaria y alertas.
- Historial de mediciones con filtros, orden y exportación a CSV.
- Estadísticas de ocupación y uso de iluminación, con recomendaciones.
- Control manual de la luz (interruptor) y configuración del modo automático/manual y del umbral.

## Arquitectura

```
┌────────────┐    POST /functions/v1/esp32-sync     ┌───────────────────────┐
│   ESP32    │ ───────────────────────────────────► │ Edge Function         │
│ LDR+PIR+LED│ ◄─────────────────────────────────── │ esp32-sync            │
└────────────┘   config + comandos pendientes       └──────────┬────────────┘
                                                               │ device_sync()
┌────────────┐   supabase-js (RLS)              ┌──────────────▼────────────┐
│  App Expo  │ ◄──────────────────────────────► │ Supabase (PostgreSQL+Auth)│
│ (Expo Go)  │                                  └───────────────────────────┘
└────────────┘
```

- La **app** usa solo la clave pública de Supabase; la seguridad de los datos se aplica con políticas RLS.
- El **ESP32** no usa credenciales de usuario: se autentica con su `device_id` y un `device_token` contra la Edge Function `esp32-sync`.

## Requisitos

**Software (Debian/Linux)**

- Node.js **20 o posterior** y [pnpm](https://pnpm.io). Es el único gestor de paquetes del proyecto: no uses npm ni yarn.
- Git.
- [Expo Go](https://expo.dev/go) instalado en un teléfono Android (la app no necesita *development build*).
- [PlatformIO](https://platformio.org) (CLI o extensión de VS Code) para compilar y cargar el firmware.
- Una cuenta gratuita de [Supabase](https://supabase.com).

**Hardware**

- Placa ESP32.
- Módulo fotorresistivo MH de 4 pines (con salida analógica AO).
- Sensor PIR HC-SR501.
- LED y resistencia de 220–330 Ω.
- Cables y protoboard.
- Cable USB con datos para conectar el ESP32.

**Red**

- El teléfono y la computadora en la misma red WiFi (o usar el modo túnel de Expo).
- Una red WiFi de **2.4 GHz** para el ESP32.

## Instalación de la app

```bash
git clone https://github.com/mualdoo/iluminacion-salones.git
cd iluminacion-salones
pnpm install
```

El archivo `.npmrc` del proyecto (`node-linker=hoisted`) ya está incluido: Metro funciona de forma más estable con pnpm así.

## Configuración

### 1. Crear el proyecto en Supabase

1. En [supabase.com](https://supabase.com), pulsa **New project** y elige nombre y región.
2. Guarda la contraseña de la base de datos en un gestor de contraseñas. No va en la app ni en ningún archivo del proyecto.
3. Espera a que termine el aprovisionamiento.

### 2. Ejecutar el SQL

En **SQL Editor → New query**, ejecuta estos archivos **en este orden**, uno por uno:

1. `supabase/schema.sql`: tablas, restricciones, triggers y políticas RLS.
2. `supabase/phase7_device_api.sql`: credenciales de dispositivo, la función `device_sync` y la RPC `get_or_create_device_token`.

No hay pasos manuales adicionales en el panel de Supabase.

Opcional, solo para pruebas sin ESP32 (insertan datos de ejemplo; ejecútalos una vez y después de registrar un dispositivo desde la app):

- `supabase/seed_phase4.sql`: mediciones de ejemplo.
- `supabase/seed_phase5.sql`: marca el último comando pendiente como ejecutado.

### 3. Autenticación (desarrollo)

En **Authentication → Sign In / Providers → Email**, desactiva **Confirm email** para poder probar el registro sin depender del correo. En producción conviene dejarlo activado.

### 4. Variables de entorno de la app

```bash
cp .env.example .env
```

Edita `.env`:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://TU_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_clave_publica
```

- La URL está en **Project Settings → API Keys** (o en el botón **Connect**).
- Usa la clave **publishable** (`sb_publishable_...`) o, si tu panel solo muestra claves legacy, la `anon`.
- **Nunca** pongas aquí la clave `secret` ni la `service_role`.
- `.env` está en `.gitignore`; no lo subas al repositorio.

### 5. Desplegar la Edge Function

La función `esp32-sync` (`supabase/functions/esp32-sync/index.ts`) recibe las mediciones del ESP32 y le devuelve la configuración y los comandos pendientes. Llama a la función SQL `device_sync`, por eso el paso 2 debe estar hecho antes.

Desde la raíz del proyecto:

```bash
pnpm add -D supabase
# Solo si pnpm avisa que bloqueó scripts de supabase:
# pnpm approve-builds

[ -f supabase/config.toml ] || pnpm exec supabase init
grep -q 'functions.esp32-sync' supabase/config.toml || cat supabase/config.fragment.toml >> supabase/config.toml

pnpm exec supabase login
pnpm exec supabase link --project-ref TU_PROJECT_REF
pnpm exec supabase functions deploy esp32-sync --no-verify-jwt --use-api
```

- `TU_PROJECT_REF` es el *Reference ID* del proyecto (**Project Settings → General**).
- La función se despliega con `--no-verify-jwt` (`verify_jwt = false` en `config.toml`) porque el ESP32 no tiene un JWT de usuario: se autentica con `x-device-token`, cuyo SHA-256 se compara con el guardado en `device_credentials`.
- Las variables `SUPABASE_URL` y `SUPABASE_SECRET_KEYS` (o, como respaldo, `SUPABASE_SERVICE_ROLE_KEY`) las proporciona Supabase a la función. No tienes que crear secretos propios.

### 6. Registrar un dispositivo y obtener sus credenciales

1. Inicia la app (sección *Ejecución*), crea una cuenta e inicia sesión.
2. En la pestaña **Dispositivos**, pulsa **Registrar dispositivo**.
3. Al guardarlo se abre el modal **Credenciales ESP32** con el `DEVICE_ID` y el `DEVICE_TOKEN`. Cópialos con los botones de la app.
4. Puedes volver a abrirlo con el botón **Credenciales ESP32** de la tarjeta del dispositivo.

> El token se entrega en claro **una sola vez**, al generarse; la app lo guarda cifrado en el teléfono. Si desinstalas la app o borras sus datos, no podrá recuperarse: copia los valores al `secrets.h` en cuanto aparezcan. Un dispositivo cuyo token ya existía en el servidor (por ejemplo, creado desde el SQL Editor) muestra solo el ID y una nota explicativa.

### 7. Cableado del ESP32

| Componente | Conexión |
| --- | --- |
| Módulo fotorresistivo MH (4 pines) | VCC → **3V3**, GND → **GND**, AO → **GPIO34** (DO sin conectar) |
| PIR HC-SR501 | VCC → **VIN/5V** (alimentado por USB), OUT → **GPIO27**, GND → **GND** |
| LED | **GPIO26** → resistencia de 220–330 Ω → ánodo; cátodo → **GND** |

Notas:

- El módulo fotorresistivo ya trae su resistencia divisora: no agregues una externa de 10 kΩ.
- Su lectura es inversa (mayor valor crudo con menos luz). El firmware la compensa con las constantes `LDR_RAW_DARK` y `LDR_RAW_BRIGHT` de `esp32_iluminacion.ino`; ajústalas a tu módulo si la escala no coincide.
- La salida del PIR no debe superar 3.3 V. Revisa la serigrafía de tu sensor, porque el orden de sus pines puede cambiar.

### 8. Configurar y cargar el firmware

El firmware está en `firmware/esp32_iluminacion/`:

| Archivo | Uso |
| --- | --- |
| `esp32_iluminacion.ino` | Firmware |
| `secrets.example.h` | Plantilla de credenciales |
| `secrets.h` | Tu copia local con valores reales (excluida de Git) |
| `platformio.ini` | Configuración de PlatformIO (115200 baudios) |

1. Crea tu copia de credenciales:

   ```bash
   cd firmware/esp32_iluminacion
   cp secrets.example.h secrets.h
   ```

2. Completa `secrets.h`:

   ```cpp
   #pragma once

   #define WIFI_SSID      "tu_red_wifi_2_4ghz"
   #define WIFI_PASSWORD  "tu_contraseña_wifi"
   #define SUPABASE_URL   "https://TU_PROJECT_REF.supabase.co"   // sin "/" final
   #define DEVICE_ID      "uuid_copiado_desde_la_app"
   #define DEVICE_TOKEN   "token_copiado_desde_la_app"
   ```

3. Da permiso de acceso al puerto serie (una sola vez; cierra sesión y vuelve a entrar para que surta efecto):

   ```bash
   sudo usermod -aG dialout $USER
   ```

4. Compila, carga y abre el monitor serie:

   ```bash
   pio run
   pio run -t upload
   pio device monitor
   ```

   En VS Code puedes usar los botones *Build*, *Upload* y *Monitor* de la extensión de PlatformIO.

Dependencias del firmware: `WiFi`, `WiFiClientSecure` y `HTTPClient` vienen con el core de ESP32; **ArduinoJson** (serie 7, `^7.4.3`) se instala automáticamente con PlatformIO. Si usas Arduino IDE, instala ArduinoJson 7.x desde el gestor de librerías.

### Comportamiento del dispositivo

| Operación | Frecuencia |
| --- | --- |
| Lectura local de sensores | Cada 200 ms |
| Envío de mediciones | Cada 10 s |
| Consulta de comandos y configuración | En cada sincronización (normalmente cada 10 s) |
| Envío anticipado | Al cambiar el PIR o terminar su estabilización |
| Separación mínima entre peticiones | 2 s |
| Reintento tras un fallo | A partir de 5 s |

Durante los primeros 30 segundos (estabilización del PIR) no se envía el movimiento. Un cambio de luz no provoca envío anticipado.

## Ejecución

```bash
pnpm start
```

1. Abre **Expo Go** en el teléfono Android y escanea el QR de la terminal.
2. Si el QR no conecta (por ejemplo, redes con aislamiento de clientes), usa el modo túnel:

   ```bash
   pnpm start --tunnel
   ```

3. Después de cambiar `.env`, reinicia limpiando la caché:

   ```bash
   pnpm start --clear
   ```

### Verificaciones

```bash
pnpm exec tsc --noEmit      # tipos de TypeScript
pnpm dlx expo-doctor        # compatibilidad de versiones de Expo
```

Ejecuta `tsc` después de iniciar Expo al menos una vez, para que se generen los tipos de las rutas.

### Comprobar que todo funciona

1. Con el ESP32 encendido y conectado, el dispositivo pasa de *Pendiente* a *En línea* en la pestaña **Dispositivos** y se actualiza su última conexión.
2. En el **Panel** aparecen el nivel de iluminación y el estado del movimiento.
3. En **Control**, el interruptor crea un comando que el ESP32 ejecuta en su siguiente sincronización: pasa de *Pendiente* a *Ejecutado* y el LED responde.
4. En **Historial** se listan las mediciones guardadas.

## Estructura del proyecto

```
iluminacion-salones/
├── app/                      # Pantallas (Expo Router)
│   ├── (auth)/               # Inicio de sesión y registro
│   └── (protected)/          # Rutas con sesión
│       ├── (tabs)/           # Panel, Dispositivos, Historial y Control
│       └── stats.tsx         # Estadísticas y recomendaciones
├── components/               # Componentes reutilizables
├── constants/                # Tema y constantes
├── firmware/esp32_iluminacion/  # Firmware del ESP32 (PlatformIO)
├── hooks/                    # Hooks de datos y estado
├── providers/                # Contextos (sesión, dispositivos)
├── services/                 # Acceso a Supabase, exportación CSV
├── supabase/
│   ├── schema.sql            # Esquema inicial y RLS
│   ├── phase7_device_api.sql # API de dispositivos (device_sync, tokens)
│   ├── seed_phase4.sql       # Datos de prueba (opcional)
│   ├── seed_phase5.sql       # Simula la respuesta del dispositivo (opcional)
│   └── functions/esp32-sync/ # Edge Function para el ESP32
├── types/                    # Tipos de TypeScript
└── utils/                    # Utilidades puras
```

## Solución de problemas

| Problema | Qué revisar |
| --- | --- |
| La app muestra "Falta configurar Supabase" | Que exista `.env` con ambas variables y reinicia con `pnpm start --clear`. |
| El QR no conecta | Misma red WiFi para el teléfono y la computadora, o usa `pnpm start --tunnel`. |
| El registro no deja entrar | Con **Confirm email** activado, confirma el correo antes de iniciar sesión. |
| No aparece el token en el modal | Ya existía una credencial en el servidor (solo se muestra una vez). Se necesita un dispositivo nuevo. |
| El ESP32 no se conecta al WiFi | Debe ser una red de **2.4 GHz**; revisa `WIFI_SSID` y `WIFI_PASSWORD`. |
| La función responde `401` | `DEVICE_ID` o `DEVICE_TOKEN` incorrectos: cópialos de nuevo desde la app (64 caracteres hexadecimales en minúsculas). |
| La función responde `400` | Cuerpo inválido: revisa el UUID, que `light` esté entre 0 y 1000 y que `motion` sea 0 o 1. |
| La función responde `500` | Verifica que ejecutaste `phase7_device_api.sql` y que la función está desplegada. |
| Error de permisos al cargar el firmware | Agrega tu usuario al grupo `dialout` (paso 8) y vuelve a iniciar sesión. |
| El dispositivo sigue en *Pendiente* | El ESP32 aún no se ha sincronizado: revisa el monitor serie y que `SUPABASE_URL` no termine en `/`. |
| La luz se ve invertida o fuera de escala | Ajusta `LDR_RAW_DARK` y `LDR_RAW_BRIGHT` en el firmware. |

## Seguridad

- No subas al repositorio `.env` ni `firmware/esp32_iluminacion/secrets.h`.
- En la app solo se usa la clave pública (*publishable*/*anon*). Las claves `secret` y `service_role` nunca deben incluirse en la app ni en el firmware.
- Quien tenga el `DEVICE_TOKEN` puede enviar mediciones como ese dispositivo: no lo compartas.