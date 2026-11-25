import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/dashboard/Card';
import { FormMessage } from '@/components/FormMessage';
import { FilterChips } from '@/components/measurements/FilterChips';
import {
    LIGHT_THRESHOLD_MAX,
    LIGHT_THRESHOLD_MIN,
    LIGHT_THRESHOLD_PRESETS,
    LIGHT_THRESHOLD_STEP,
} from '@/constants/control';
import { LIGHT_UNIT } from '@/constants/dashboard';
import { colors, radius, spacing } from '@/constants/theme';
import type { ConfigurationInput } from '@/types/control';
import type { Configuration } from '@/types/database';
import type { ServiceResult } from '@/types/service';
import type { IconName } from '@/types/ui';
import { clampThreshold, parseThreshold } from '@/utils/configuration';

type Props = {
  configuration: Configuration;
  isSaving: boolean;
  onSave: (input: ConfigurationInput) => Promise<ServiceResult<Configuration>>;
};

const PRESET_OPTIONS = LIGHT_THRESHOLD_PRESETS.map((value) => ({
  key: String(value),
  label: String(value),
}));

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

export function ConfigurationCard({ configuration, isSaving, onSave }: Props) {
  const [automatic, setAutomatic] = useState(configuration.automatic_mode);
  const [thresholdText, setThresholdText] = useState(String(configuration.light_threshold));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Si la configuración cambia desde fuera (por ejemplo, "Cambiar a modo manual"), se sincroniza el borrador.
  useEffect(() => {
    setAutomatic(configuration.automatic_mode);
    setThresholdText(String(configuration.light_threshold));
  }, [configuration.automatic_mode, configuration.light_threshold]);

  const isDirty =
    automatic !== configuration.automatic_mode ||
    thresholdText.trim() !== String(configuration.light_threshold);

  const editThreshold = (text: string) => {
    setThresholdText(text);
    setError(null);
    setSaved(false);
  };

  const step = (delta: number) => {
    const parsed = parseThreshold(thresholdText);
    const base = parsed.value ?? configuration.light_threshold;
    editThreshold(String(clampThreshold(base + delta)));
  };

  const selectMode = (value: boolean) => {
    setAutomatic(value);
    setError(null);
    setSaved(false);
  };

  const handleSave = async () => {
    const parsed = parseThreshold(thresholdText);
    if (parsed.value === null) {
      setError(parsed.error);
      return;
    }
    setError(null);
    setSaved(false);
    const result = await onSave({ automatic_mode: automatic, light_threshold: parsed.value });
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
        <Text style={styles.hint}>{MODES.find((m) => m.automatic === automatic)?.description}</Text>
      </View>

      <View style={styles.group}>
        <Text style={styles.label}>Umbral de iluminación ({LIGHT_UNIT})</Text>
        <View style={styles.stepper}>
          <Pressable
            onPress={() => step(-LIGHT_THRESHOLD_STEP)}
            disabled={isSaving}
            accessibilityRole="button"
            accessibilityLabel={`Bajar el umbral ${LIGHT_THRESHOLD_STEP}`}
            style={({ pressed }) => [styles.stepButton, pressed && styles.dimmed]}
          >
            <Text style={styles.stepLabel}>-{LIGHT_THRESHOLD_STEP}</Text>
          </Pressable>
          <TextInput
            value={thresholdText}
            onChangeText={editThreshold}
            keyboardType="number-pad"
            maxLength={4}
            editable={!isSaving}
            accessibilityLabel="Umbral de iluminación"
            style={[styles.input, error ? styles.inputError : null]}
          />
          <Pressable
            onPress={() => step(LIGHT_THRESHOLD_STEP)}
            disabled={isSaving}
            accessibilityRole="button"
            accessibilityLabel={`Subir el umbral ${LIGHT_THRESHOLD_STEP}`}
            style={({ pressed }) => [styles.stepButton, pressed && styles.dimmed]}
          >
            <Text style={styles.stepLabel}>+{LIGHT_THRESHOLD_STEP}</Text>
          </Pressable>
        </View>
        <FilterChips options={PRESET_OPTIONS} value={thresholdText.trim()} onChange={editThreshold} />
        <Text style={styles.hint}>
          Rango válido: {LIGHT_THRESHOLD_MIN} a {LIGHT_THRESHOLD_MAX} {LIGHT_UNIT} (unidades
          relativas, no lux). En modo automático la luz se enciende cuando el nivel baja de este
          valor con el salón ocupado.
        </Text>
      </View>

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
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stepButton: {
    width: 64,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  stepLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
  input: {
    flex: 1,
    height: 48,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  inputError: { borderColor: colors.error },
  dimmed: { opacity: 0.6 },
});