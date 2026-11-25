import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AuthFormLayout } from '@/components/AuthFormLayout';
import { Button } from '@/components/Button';
import { FormMessage } from '@/components/FormMessage';
import { TextField } from '@/components/TextField';
import { colors, spacing } from '@/constants/theme';
import { signUpWithEmail } from '@/services/auth/authService';
import { hasErrors, validateRegisterForm, type FieldErrors } from '@/utils/validation';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors<'email' | 'password' | 'confirmPassword'>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const validation = validateRegisterForm({ email, password, confirmPassword });
    setErrors(validation);
    setFormError(null);
    setFormSuccess(null);
    if (hasErrors(validation)) return;

    setIsSubmitting(true);
    const result = await signUpWithEmail(email, password);
    setIsSubmitting(false);

    if (!result.ok) {
      setFormError(result.message);
      return;
    }

    // Sin confirmación de correo: ya hay sesión y la app redirige sola.
    if (result.needsEmailConfirmation) {
      setFormSuccess('Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesión.');
      setPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <AuthFormLayout title="Crear cuenta" subtitle="Regístrate para comenzar a usar la aplicación.">
      {formError ? <FormMessage type="error" message={formError} /> : null}
      {formSuccess ? <FormMessage type="success" message={formSuccess} /> : null}

      <TextField
        label="Correo electrónico"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        autoComplete="email"
        placeholder="correo@ejemplo.com"
        editable={!isSubmitting}
      />
      <TextField
        label="Contraseña"
        value={password}
        onChangeText={setPassword}
        error={errors.password}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        placeholder="Mínimo 8 caracteres"
        editable={!isSubmitting}
      />
      <TextField
        label="Confirmar contraseña"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        error={errors.confirmPassword}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        placeholder="Repite tu contraseña"
        editable={!isSubmitting}
      />

      <Button label="Registrarme" onPress={handleSubmit} loading={isSubmitting} />

      <View style={styles.footer}>
        <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
        <Link href="/login" style={styles.link}>
          Inicia sesión
        </Link>
      </View>
    </AuthFormLayout>
  );
}

const styles = StyleSheet.create({
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.sm },
  footerText: { fontSize: 15, color: colors.textMuted },
  link: { fontSize: 15, fontWeight: '700', color: colors.text },
});