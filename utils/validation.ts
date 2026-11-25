const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD_LENGTH = 8;

export type FieldErrors<K extends string> = Partial<Record<K, string>>;

export function hasErrors(errors: object): boolean {
  return Object.keys(errors).length > 0;
}

type LoginInput = { email: string; password: string };
type RegisterInput = LoginInput & { confirmPassword: string };

function validateEmail(email: string): string | undefined {
  const value = email.trim();
  if (!value) return 'Ingresa tu correo electrónico.';
  if (!EMAIL_REGEX.test(value)) return 'Ingresa un correo electrónico válido.';
  return undefined;
}

export function validateLoginForm(input: LoginInput): FieldErrors<'email' | 'password'> {
  const errors: FieldErrors<'email' | 'password'> = {};
  const emailError = validateEmail(input.email);
  if (emailError) errors.email = emailError;
  if (!input.password) errors.password = 'Ingresa tu contraseña.';
  return errors;
}

export function validateRegisterForm(
  input: RegisterInput,
): FieldErrors<'email' | 'password' | 'confirmPassword'> {
  const errors: FieldErrors<'email' | 'password' | 'confirmPassword'> = {};
  const emailError = validateEmail(input.email);
  if (emailError) errors.email = emailError;

  if (!input.password) {
    errors.password = 'Ingresa una contraseña.';
  } else if (input.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }

  if (!input.confirmPassword) {
    errors.confirmPassword = 'Confirma tu contraseña.';
  } else if (input.password !== input.confirmPassword) {
    errors.confirmPassword = 'Las contraseñas no coinciden.';
  }
  return errors;
}