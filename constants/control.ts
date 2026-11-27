export const COMMAND_TYPE_SET_LIGHT = 'set_light';

export const LIGHT_THRESHOLD_MIN = 0;
export const LIGHT_THRESHOLD_MAX = 1000;
export const LIGHT_THRESHOLD_STEP = 50;
export const LIGHT_THRESHOLD_PRESETS = [300, 500, 700] as const;

export const COMMANDS_LIMIT = 20;
export const COMMANDS_POLL_MS = 10_000;
// En modo automático, un comando ejecutado más viejo que esto ya no define el estado de la luz.
export const COMMAND_RECENT_MINUTES = 30;

export const PENDING_COMMAND_ALERT_MINUTES = 2;
export const PENDING_COMMAND_CRITICAL_MINUTES = 10;