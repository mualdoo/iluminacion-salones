export const colors = {
  background: '#F5F7FA',
  surface: '#FFFFFF',
  primary: '#F5A524',
  text: '#1B1F24',
  textMuted: '#5F6B7A',
  success: '#2E9E5B',
  successSoft: '#E3F5EA',
  warning: '#9A5B00',
  warningSoft: '#FFF1D6',
  info: '#1F5FBF',
  infoSoft: '#E6EFFC',
  neutralSoft: '#EBEEF2',
  error: '#C62828',
  errorSoft: '#FDECEA',
  border: '#E1E5EB',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  md: 12,
  lg: 20,
  pill: 999,
} as const;

// Pares de color (texto/ícono y fondo suave) para etiquetas e indicadores.
export const tones = {
  success: { fg: colors.success, bg: colors.successSoft },
  warning: { fg: colors.warning, bg: colors.warningSoft },
  error: { fg: colors.error, bg: colors.errorSoft },
  info: { fg: colors.info, bg: colors.infoSoft },
  neutral: { fg: colors.textMuted, bg: colors.neutralSoft },
} as const;

export type Tone = keyof typeof tones;