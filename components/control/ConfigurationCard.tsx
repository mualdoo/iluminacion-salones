import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/dashboard/Card';
import { FormMessage } from '@/components/FormMessage';
import { colors, radius, spacing } from '@/constants/theme';
import type { ConfigurationInput } from '@/types/control';
import type { Configuration } from '@/types/database';
import type { ServiceResult } from '@/types/service';
import type { IconName } from '@/types/ui';

type Props = {
  configuration: Configuration;
  isSaving: boolean;
  onSave: (input: ConfigurationInput) => Promise<ServiceResult<Configuration>>;
};

// Los valores internos no se muestran en pantalla.
const LEVELS: ReadonlyArray<{ value: number; title: string; description: string }> = [
  {
    value: 100,
    title: 'Muy tolerante',
    description: 'El lugar acepta mucha oscuridad antes de encender la luz.',
  },
  {
    value: 300,
    title: 'Tolerante',
    description: 'El lugar acepta un poco de oscuridad.',
  },
  {
    value: 500,
    title: 'Equilibrado',
    description: 'Se enciende cuando la luz natural empieza a ser insuficiente.',
  },
  {
    value: 700,
    title: 'Exigente',
    description: 'Se prefiere un salón bien iluminado.',
  },
  {
    value: 900,
    title: 'Siempre con luz',
    description: 'Se necesita luz siempre, incluso con poca falta de luz.',
  },
];

const LAST_INDEX = LEVELS.length - 1;

const MODES: ReadonlyArray<{ automatic: boolean; label: string; icon: IconName; description: string }> = [
  {
    automatic: true,
    label: 'Automático',
    icon: 'sync-outline',
    description: 'El sistema decide según el umbral de iluminación y la presencia.',
  },
  {
    automatic: false,
    label: 'Manual',
    icon: 'hand-left-outline',
    description: 'Tú enciendes y apagas la luz mediante comandos.',
  },
];

function nearestIndex(value: number): number {
  let best = 0;
  for (let i = 1; i < LEVELS.length; i++) {
    if (Math.abs(LEVELS[i].value - value) < Math.abs(LEVELS[best].value - value)) best = i;
  }
  return best;
}

const THUMB = 28;
const STOP = 10;
const RAIL_HEIGHT = 8;
const AREA_HEIGHT = 44;

type SliderProps = {
  index: number;
  disabled: boolean;
  onChange: (index: number) => void;
};

function LevelSlider({ index, disabled, onChange }: SliderProps) {
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);
  const indexRef = useRef(index);
  const disabledRef = useRef(disabled);
  const onChangeRef = useRef(onChange);
  indexRef.current = index;
  disabledRef.current = disabled;
  onChangeRef.current = onChange;

  const pick = (x: number) => {
    const usable = widthRef.current - THUMB;
    if (usable <= 0) return;
    const ratio = Math.min(1, Math.max(0, (x - THUMB / 2) / usable));
    const next = Math.round(ratio * LAST_INDEX);
    if (next !== indexRef.current) {
      indexRef.current = next;
      onChangeRef.current(next);
    }
  };

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabledRef.current,
      onMoveShouldSetPanResponder: () => !disabledRef.current,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (event) => pick(event.nativeEvent.locationX),
      onPanResponderMove: (event) => pick(event.nativeEvent.locationX),
    }),
  ).current;

  const usable = Math.max(0, width - THUMB);
  const positionOf = (i: number) => (i / LAST_INDEX) * usable;

  return (
    <View
      style={styles.sliderArea}
      onLayout={(event) => {
        widthRef.current = event.nativeEvent.layout.width;
        setWidth(event.nativeEvent.layout.width);
      }}
    >
      <View style={styles.rail} pointerEvents="none" />
      <View
        style={[styles.railFill, { width: positionOf(index) }]}
        pointerEvents="none"
      />
      {LEVELS.map((level, i) => (
        <View
          key={level.value}
          pointerEvents="none"
          style={[
            styles.stop,
            { left: THUMB / 2 - STOP / 2 + positionOf(i) },
            i <= index && styles.stopActive,
          ]}
        />
      ))}
      <View
        pointerEvents="none"
        style={[styles.thumb, { left: positionOf(index) }]}
      />
      {/* Capa transparente que recibe los toques y el arrastre */}
      <View
        style={StyleSheet.absoluteFill}
        {...responder.panHandlers}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Sensibilidad de la iluminación"
        accessibilityValue={{ text: LEVELS[index].title }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(event) => {
          if (disabled) return;
          if (event.nativeEvent.actionName === 'increment') onChange(Math.min(LAST_INDEX, index + 1));
          if (event.nativeEvent.actionName === 'decrement') onChange(Math.max(0, index - 1));
        }}
      />
    </View>
  );
}

export function ConfigurationCard({ configuration, isSaving, onSave }: Props) {
  const [automatic, setAutomatic] = useState(configuration.automatic_mode);
  const [threshold, setThreshold] = useState(configuration.light_threshold);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Si la configuración cambia desde fuera (por ejemplo, "Cambiar a modo manual"), se sincroniza el borrador.
  useEffect(() => {
    setAutomatic(configuration.automatic_mode);
    setThreshold(configuration.light_threshold);
  }, [configuration.automatic_mode, configuration.light_threshold]);

  const isDirty =
    automatic !== configuration.automatic_mode || threshold !== configuration.light_threshold;

  const selectedIndex = nearestIndex(threshold);
  const selectedLevel = LEVELS[selectedIndex];

  const selectLevel = (index: number) => {
    setThreshold(LEVELS[index].value);
    setError(null);
    setSaved(false);
  };

  const selectMode = (value: boolean) => {
    setAutomatic(value);
    setError(null);
    setSaved(false);
  };

  const handleSave = async () => {
    setError(null);
    setSaved(false);
    const result = await onSave({ automatic_mode: automatic, light_threshold: threshold });
    if (result.ok) setSaved(true);
    else setError(result.message);
  };

  return (
    <Card title="Configuración del dispositivo" icon="settings-outline">
      <View style={styles.group}>
        <Text style={styles.label}>Modo de operación</Text>
        <View style={styles.modes}>
          {MODES.map((mode) => {
            const selected = mode.automatic === automatic;
            return (
              <Pressable
                key={mode.label}
                onPress={() => selectMode(mode.automatic)}
                disabled={isSaving}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={[styles.mode, selected && styles.modeSelected]}
              >
                <Ionicons name={mode.icon} size={20} color={colors.text} />
                <Text style={styles.modeLabel}>{mode.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {automatic ? (
        <View style={styles.group}>
          <Text style={styles.label}>¿Cuánta luz necesita el salón?</Text>
          <LevelSlider index={selectedIndex} disabled={isSaving} onChange={selectLevel} />
          <View style={styles.ends}>
            <Text style={styles.endLabel}>Acepta oscuridad</Text>
            <Text style={styles.endLabel}>Siempre con luz</Text>
          </View>
          <View style={styles.descriptionBox}>
            <Text style={styles.descriptionTitle}>{selectedLevel.title}</Text>
          </View>
        </View>
      ) : null}

      {error ? <FormMessage type="error" message={error} /> : null}
      {saved && !isDirty ? (
        <FormMessage type="success" message="Configuración guardada correctamente." />
      ) : null}

      <Button
        label="Guardar configuración"
        onPress={handleSave}
        loading={isSaving}
        disabled={!isDirty}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  hint: { fontSize: 12, lineHeight: 17, color: colors.textMuted },
  modes: { flexDirection: 'row', gap: spacing.sm },
  mode: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  modeSelected: { backgroundColor: colors.warningSoft, borderColor: colors.primary, borderWidth: 2 },
  modeLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  sliderArea: { height: AREA_HEIGHT, justifyContent: 'center' },
  rail: {
    position: 'absolute',
    left: THUMB / 2,
    right: THUMB / 2,
    height: RAIL_HEIGHT,
    borderRadius: radius.pill,
    backgroundColor: colors.neutralSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  railFill: {
    position: 'absolute',
    left: THUMB / 2,
    height: RAIL_HEIGHT,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  stop: {
    position: 'absolute',
    width: STOP,
    height: STOP,
    borderRadius: STOP / 2,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
  },
  stopActive: { borderColor: colors.primary },
  thumb: {
    position: 'absolute',
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.surface,
    elevation: 3,
  },
  ends: { flexDirection: 'row', justifyContent: 'space-between' },
  endLabel: { fontSize: 11, color: colors.textMuted },
  descriptionBox: {
    gap: 2,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.warningSoft,
  },
  descriptionTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  descriptionText: { fontSize: 13, lineHeight: 18, color: colors.text },
});