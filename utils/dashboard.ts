import type { Tone } from '@/constants/theme';

const pad = (value: number) => String(value).padStart(2, '0');

export function formatClock(timestamp: number): string {
  const date = new Date(timestamp);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

type LightBand = { label: string; range: string; min: number; tone: Tone };

export const LIGHT_BANDS: readonly LightBand[] = [
  { label: 'Baja', range: '0–249', min: 0, tone: 'warning' },
  { label: 'Media', range: '250–599', min: 250, tone: 'info' },
  { label: 'Alta', range: '600–1000', min: 600, tone: 'success' },
];

export function getLightBand(value: number): LightBand {
  for (let i = LIGHT_BANDS.length - 1; i >= 0; i--) {
    if (value >= LIGHT_BANDS[i].min) return LIGHT_BANDS[i];
  }
  return LIGHT_BANDS[0];
}