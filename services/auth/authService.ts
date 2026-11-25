import type { AuthError } from '@supabase/supabase-js';

import { getSupabaseClient } from '@/services/supabase/client';

type Failure = { ok: false; message: string };
export type SignInResult = { ok: true } | Failure;
export type SignUpResult = { ok: true; needsEmailConfirmation: boolean } | Failure;
export type SignOutResult = { ok: true } | Failure;

const GENERIC_ERROR = 'Ocurrió un error inesperado. Inténtalo de nuevo.';

function translateAuthError(error: AuthError): string {
  if (error.name === 'AuthRetryableFetchError') {
    return 'No se pudo conectar con el servidor. Revisa tu conexión a internet e inténtalo de nuevo.';
  }
  switch (error.code) {
    case 'invalid_credentials':
      return 'Correo o contraseña incorrectos.';
    case 'email_not_confirmed':
      return 'Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.';
    case 'user_already_exists':
    case 'email_exists':
      return 'Ya existe una cuenta con este correo.';
    case 'weak_password':
      return 'La contraseña es demasiado débil. Usa al menos 8 caracteres.';
    case 'email_address_invalid':
      return 'El correo electrónico no es válido.';
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.';
    case 'signup_disabled':
      return 'El registro de nuevos usuarios está deshabilitado.';
    default:
      return GENERIC_ERROR;
  }
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export async function signInWithEmail(email: string, password: string): Promise<SignInResult> {
  try {
    const { error } = await getSupabaseClient().auth.signInWithPassword({
      email: normalizeEmail(email),
      password,
    });
    if (error) return { ok: false, message: translateAuthError(error) };
    return { ok: true };
  } catch {
    return { ok: false, message: GENERIC_ERROR };
  }
}

export async function signUpWithEmail(email: string, password: string): Promise<SignUpResult> {
  try {
    const { data, error } = await getSupabaseClient().auth.signUp({
      email: normalizeEmail(email),
      password,
    });
    if (error) return { ok: false, message: translateAuthError(error) };
    // Sin sesión = el proyecto exige confirmar el correo antes de entrar.
    return { ok: true, needsEmailConfirmation: !data.session };
  } catch {
    return { ok: false, message: GENERIC_ERROR };
  }
}

export async function signOut(): Promise<SignOutResult> {
  try {
    // scope 'local': cierra solo este dispositivo y borra la sesión guardada localmente.
    const { error } = await getSupabaseClient().auth.signOut({ scope: 'local' });
    if (error) return { ok: false, message: translateAuthError(error) };
    return { ok: true };
  } catch {
    return { ok: false, message: GENERIC_ERROR };
  }
}