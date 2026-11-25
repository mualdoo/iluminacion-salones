import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

import { Button } from '@/components/Button';
import { FormMessage } from '@/components/FormMessage';
import { TextField } from '@/components/TextField';
import { colors, radius, spacing } from '@/constants/theme';
import type { DeviceInput, ServiceResult } from '@/types/service';
import { DESCRIPTION_MAX_LENGTH, NAME_MAX_LENGTH, validateDeviceForm } from '@/utils/devices';
import { hasErrors, type FieldErrors } from '@/utils/validation';

type Props = {
  mode: 'create' | 'edit';
  initialValues?: DeviceInput;
  onSubmit: (input: DeviceInput) => Promise<ServiceResult<unknown>>;
  onClose: () => void;
};

// El formulario se monta solo cuando se abre, así el estado inicial siempre es el correcto.
export function DeviceFormModal({ mode, initialValues, onSubmit, onClose }: Props) {
  const [name, setName] = useState(initialValues?.name ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [errors, setErrors] = useState<FieldErrors<'name' | 'description'>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const validation = validateDeviceForm({ name, description });
    setErrors(validation);
    setFormError(null);
    if (hasErrors(validation)) return;

    setIsSubmitting(true);
    const result = await onSubmit({ name, description });
    if (result.ok) {
      onClose();
      return;
    }
    setIsSubmitting(false);
    setFormError(result.message);
  };

  const handleClose = () => {
    if (!isSubmitting) onClose();
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.sheet}>
            <Text style={styles.title}>
              {mode === 'create' ? 'Registrar dispositivo' : 'Editar dispositivo'}
            </Text>
            <Text style={styles.subtitle}>
              {mode === 'create'
                ? 'Registra un salón. Podrás vincular el ESP32 en una fase posterior.'
                : 'Puedes cambiar el nombre y la descripción.'}
            </Text>

            {formError ? <FormMessage type="error" message={formError} /> : null}

            <TextField
              label="Nombre"
              value={name}
              onChangeText={setName}
              error={errors.name}
              placeholder="Ej. Salón 101"
              maxLength={NAME_MAX_LENGTH}
              editable={!isSubmitting}
              autoFocus
            />
            <TextField
              label="Descripción (opcional)"
              value={description}
              onChangeText={setDescription}
              error={errors.description}
              placeholder="Ej. Edificio A, planta baja"
              maxLength={DESCRIPTION_MAX_LENGTH}
              editable={!isSubmitting}
              multiline
              style={styles.multiline}
            />

            <View style={styles.actions}>
              <Button
                label={mode === 'create' ? 'Registrar' : 'Guardar cambios'}
                onPress={handleSubmit}
                loading={isSubmitting}
              />
              <Button
                label="Cancelar"
                variant="secondary"
                onPress={handleClose}
                disabled={isSubmitting}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.45)' },
  // El formulario se ancla arriba para que el teclado no tape los campos en Android.
  scroll: { flexGrow: 1, justifyContent: 'flex-start', padding: spacing.lg, paddingTop: 72 },
  sheet: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 14, lineHeight: 20, color: colors.textMuted },
  multiline: { height: 96, paddingTop: spacing.sm + 4, textAlignVertical: 'top' },
  actions: { gap: spacing.sm },
});