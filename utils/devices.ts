import type { Tone } from '@/constants/theme';
import type { DeviceStatus } from '@/types/database';
import type { IconName } from '@/types/ui';
import type { FieldErrors } from '@/utils/validation';

export const NAME_MAX_LENGTH = 100;
export const DESCRIPTION_MAX_LENGTH = 500;

export const DEVICE_STATUS_META: Record<
  DeviceStatus,
  { label: string; tone: Tone; icon: IconName }
> = {
  online: { label: 'En línea', tone: 'success', icon: 'wifi' },
  offline: { label: 'Fuera de línea', tone: 'error', icon: 'cloud-offline-outline' },
  pending: { label: 'Pendiente', tone: 'warning', icon: 'time-outline' },
};

export function validateDeviceForm(input: {
  name: string;
  description: string;
}): FieldErrors<'name' | 'description'> {
  const errors: FieldErrors<'name' | 'description'> = {};
  const name = input.name.trim();

  if (!name) {
    errors.name = 'Ingresa un nombre para el dispositivo.';
  } else if (name.length > NAME_MAX_LENGTH) {
    errors.name = `El nombre no puede superar ${NAME_MAX_LENGTH} caracteres.`;
  }

  if (input.description.trim().length > DESCRIPTION_MAX_LENGTH) {
    errors.description = `La descripción no puede superar ${DESCRIPTION_MAX_LENGTH} caracteres.`;
  }
  return errors;
}