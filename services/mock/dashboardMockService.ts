import {
    HISTORY_LENGTH,
    MAX_EVENTS,
    MAX_LIGHT_LEVEL,
    REFRESH_INTERVAL_MS,
} from '@/constants/dashboard';
import type {
    ActivityEvent,
    ActivityEventType,
    ConnectionStatus,
    DashboardSnapshot,
    OperationMode,
} from '@/types/dashboard';

// Todo lo de este archivo es SIMULADO: no lee sensores ni toca Supabase.

const AUTO_LIGHT_ON_BELOW = 400;
const AUTO_LIGHT_OFF_ABOVE = 550; // histéresis para que la luz no parpadee
const VACATE_AFTER_TICKS = 3;

const EVENT_DESCRIPTIONS: Record<ActivityEventType, string> = {
  motion_detected: 'Movimiento detectado',
  room_vacated: 'Salón desocupado',
  light_on: 'Iluminación encendida',
  light_off: 'Iluminación apagada',
  device_connected: 'Dispositivo conectado',
  device_disconnected: 'Dispositivo desconectado',
  mode_automatic: 'Modo automático activado',
  mode_manual: 'Modo manual activado',
};

let eventCounter = 0;

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const chance = (probability: number) => Math.random() < probability;

function createEvent(type: ActivityEventType, timestamp: number): ActivityEvent {
  eventCounter += 1;
  return {
    id: `${timestamp}-${eventCounter}`,
    type,
    description: EVENT_DESCRIPTIONS[type],
    timestamp,
  };
}

function mergeEvents(newEvents: ActivityEvent[], previous: ActivityEvent[]): ActivityEvent[] {
  // Más reciente primero
  return [...newEvents.slice().reverse(), ...previous].slice(0, MAX_EVENTS);
}

export function createInitialSnapshot(now: number): DashboardSnapshot {
  const lightLevel = Math.round(randomBetween(150, 800));
  const occupied = chance(0.7);
  const mode: OperationMode = 'automatic';
  const connection: ConnectionStatus = 'connected';
  const lampOn = occupied && lightLevel < AUTO_LIGHT_ON_BELOW;

  // Historial generado hacia atrás a partir del valor actual
  const values = new Array<number>(HISTORY_LENGTH);
  values[HISTORY_LENGTH - 1] = lightLevel;
  for (let i = HISTORY_LENGTH - 2; i >= 0; i--) {
    values[i] = Math.round(clamp(values[i + 1] + randomBetween(-120, 120), 0, MAX_LIGHT_LEVEL));
  }
  const history = values.map((value, index) => ({
    timestamp: now - (HISTORY_LENGTH - 1 - index) * REFRESH_INTERVAL_MS,
    value,
  }));

  const events: ActivityEvent[] = [
    createEvent(lampOn ? 'light_on' : 'light_off', now - 90_000),
    createEvent(occupied ? 'motion_detected' : 'room_vacated', now - 100_000),
    createEvent('device_connected', now - 150_000),
  ];

  return {
    lightLevel,
    motionDetected: occupied,
    occupied,
    lampOn,
    mode,
    connection,
    history,
    events,
    updatedAt: now,
    ticksWithoutMotion: occupied ? 0 : VACATE_AFTER_TICKS,
  };
}

export function generateNextSnapshot(prev: DashboardSnapshot, now: number): DashboardSnapshot {
  const newEvents: ActivityEvent[] = [];

  // --- Conexión ---
  let connection = prev.connection;
  if (prev.connection === 'connected' && chance(0.04)) {
    connection = 'disconnected';
  } else if (prev.connection === 'disconnected' && chance(0.5)) {
    connection = 'connected';
  }
  if (connection !== prev.connection) {
    newEvents.push(
      createEvent(connection === 'connected' ? 'device_connected' : 'device_disconnected', now),
    );
  }

  // Sin conexión no llegan datos nuevos: se conservan los últimos valores.
  if (connection === 'disconnected') {
    return { ...prev, connection, events: mergeEvents(newEvents, prev.events), updatedAt: now };
  }

  // --- Iluminación (caminata aleatoria con tendencia hacia el centro) ---
  const delta =
    randomBetween(-110, 110) + (500 - prev.lightLevel) * 0.06 + (prev.lampOn ? 25 : -10);
  const lightLevel = Math.round(clamp(prev.lightLevel + delta, 0, MAX_LIGHT_LEVEL));

  // --- Movimiento y ocupación ---
  const motionDetected = prev.occupied ? chance(0.7) : chance(0.2);
  const ticksWithoutMotion = motionDetected ? 0 : prev.ticksWithoutMotion + 1;
  const occupied =
    motionDetected || (prev.occupied && ticksWithoutMotion < VACATE_AFTER_TICKS);

  if (motionDetected && !prev.motionDetected) {
    newEvents.push(createEvent('motion_detected', now));
  }
  if (prev.occupied && !occupied) {
    newEvents.push(createEvent('room_vacated', now));
  }

  // --- Modo de operación ---
  let mode = prev.mode;
  if (chance(0.06)) {
    mode = prev.mode === 'automatic' ? 'manual' : 'automatic';
    newEvents.push(createEvent(mode === 'automatic' ? 'mode_automatic' : 'mode_manual', now));
  }

  // --- Luminaria ---
  let lampOn: boolean;
  if (mode === 'automatic') {
    const threshold = prev.lampOn ? AUTO_LIGHT_OFF_ABOVE : AUTO_LIGHT_ON_BELOW;
    lampOn = occupied && lightLevel < threshold;
  } else {
    lampOn = chance(0.08) ? !prev.lampOn : prev.lampOn;
  }
  if (lampOn !== prev.lampOn) {
    newEvents.push(createEvent(lampOn ? 'light_on' : 'light_off', now));
  }

  return {
    lightLevel,
    motionDetected,
    occupied,
    lampOn,
    mode,
    connection,
    history: [...prev.history, { timestamp: now, value: lightLevel }].slice(-HISTORY_LENGTH),
    events: mergeEvents(newEvents, prev.events),
    updatedAt: now,
    ticksWithoutMotion,
  };
}