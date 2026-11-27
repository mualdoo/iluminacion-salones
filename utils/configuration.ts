import { LIGHT_THRESHOLD_MAX, LIGHT_THRESHOLD_MIN } from '@/constants/control';

type ThresholdParse = { value: number; error: null } | { value: null; error: string };

export function parseThreshold(text: string): ThresholdParse {
  const trimmed = text.trim();
  const message = `Ingresa un número entero entre ${LIGHT_THRESHOLD_MIN} y ${LIGHT_THRESHOLD_MAX}.`;

  if (!/^\d+$/.test(trimmed)) return { value: null, error: message };

  const value = Number(trimmed);
  if (value < LIGHT_THRESHOLD_MIN || value > LIGHT_THRESHOLD_MAX) {
    return { value: null, error: message };
  }
  return { value, error: null };
}

export function clampThreshold(value: number): number {
  return Math.min(LIGHT_THRESHOLD_MAX, Math.max(LIGHT_THRESHOLD_MIN, value));
}