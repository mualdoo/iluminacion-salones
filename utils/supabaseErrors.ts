export const GENERIC_ERROR = 'Ocurrió un error inesperado. Inténtalo de nuevo.';

type DbError = { code?: string; message?: string };

export function translatePostgrestError(error: DbError): string {
  const message = (error.message ?? '').toLowerCase();
  if (message.includes('network') || message.includes('failed to fetch')) {
    return 'No se pudo conectar con el servidor. Revisa tu conexión a internet e inténtalo de nuevo.';
  }
  switch (error.code) {
    case '42501':
      return 'No tienes permiso para realizar esta acción.';
    case '23514':
      return 'Alguno de los datos no es válido. Revisa el formulario.';
    case '23505':
      return 'Ya existe un registro con esos datos.';
    case 'PGRST116':
      return 'No se encontró el registro. Puede que ya se haya eliminado.';
    case 'PGRST301':
    case 'PGRST303':
      return 'Tu sesión expiró. Cierra sesión e inicia de nuevo.';
    default:
      return GENERIC_ERROR;
  }
}