// POST /functions/v1/esp32-sync
// Header: x-device-token
// Body:   { device_id, light?, motion?, executed_command_ids?, failed_command_ids? }
import { createClient } from 'npm:@supabase/supabase-js@2';

const MAX_BODY_CHARS = 4096;
const MAX_IDS = 20;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TOKEN_RE = /^[0-9a-f]{64}$/;

/** Prefiere la secret key nueva (sb_secret_...); usa service_role como respaldo. */
function readSecretKey(): string {
  const raw = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (raw) {
    const keys = JSON.parse(raw) as Record<string, string>;
    if (keys.default) return keys.default;
  }
  const legacy = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (legacy) return legacy;
  throw new Error('No hay secret key disponible en el entorno');
}

const supabaseUrl = Deno.env.get('SUPABASE_URL');
if (!supabaseUrl) throw new Error('Falta SUPABASE_URL');

const admin = createClient(supabaseUrl, readSecretKey(), {
  auth: { persistSession: false, autoRefreshToken: false },
});

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** undefined/null = no enviado; false = inválido. */
function optionalInt(value: unknown, min: number, max: number): number | null | false {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'number' || !Number.isInteger(value)) return false;
  return value >= min && value <= max ? value : false;
}

function optionalIds(value: unknown): string[] | false {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > MAX_IDS) return false;
  return value.every((v) => typeof v === 'string' && UUID_RE.test(v))
    ? (value as string[])
    : false;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });

  const token = req.headers.get('x-device-token') ?? '';
  if (!TOKEN_RE.test(token)) return json(401, { error: 'unauthorized' });

  let body: Record<string, unknown>;
  try {
    const text = await req.text();
    if (text.length > MAX_BODY_CHARS) return json(413, { error: 'payload_too_large' });
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return json(400, { error: 'invalid_json' });
    }
    body = parsed as Record<string, unknown>;
  } catch {
    return json(400, { error: 'invalid_json' });
  }

  const deviceId = body.device_id;
  if (typeof deviceId !== 'string' || !UUID_RE.test(deviceId)) {
    return json(400, { error: 'invalid_device_id' });
  }

  const light = optionalInt(body.light, 0, 1000);
  const motion = optionalInt(body.motion, 0, 1);
  const executed = optionalIds(body.executed_command_ids);
  const failed = optionalIds(body.failed_command_ids);
  if (light === false) return json(400, { error: 'invalid_light' });
  if (motion === false) return json(400, { error: 'invalid_motion' });
  if (executed === false || failed === false) {
    return json(400, { error: 'invalid_command_ids' });
  }

  // Todo ocurre en una sola transacción dentro de device_sync.
  const { data, error } = await admin.rpc('device_sync', {
    p_device_id: deviceId,
    p_token_hash: await sha256Hex(token),
    p_light: light,
    p_motion: motion,
    p_executed_ids: executed,
    p_failed_ids: failed,
  });

  if (error) {
    // El detalle queda en los logs; nunca se registra el token.
    console.error('device_sync', error.code, error.message);
    return json(500, { error: 'sync_failed' });
  }
  if (data === null) return json(401, { error: 'unauthorized' });

  return json(200, data);
});
