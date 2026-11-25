import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AuthFormLayout } from '@/components/AuthFormLayout';
import { Button } from '@/components/Button';
import { FormMessage } from '@/components/FormMessage';
import { TextField } from '@/components/TextField';
import { colors, spacing } from '@/constants/theme';
import { signInWithEmail } from '@/services/auth/authService';
import { hasErrors, validateLoginForm, type FieldErrors } from '@/utils/validation';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors<'email' | 'password'>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const validation = validateLoginForm({ email, password });
    setErrors(validation);
    setFormError(null);
    if (hasErrors(validation)) return;

    setIsSubmitting(true);
    const result = await signInWithEmail(email, password);
    setIsSubmitting(false);

    // Si salió bien, onAuthStateChange actualiza la sesión y la ruta protegida redirige sola.
    if (!result.ok) setFormError(result.message);
  };

  return (
    <AuthFormLayout title="Iniciar sesión" subtitle="Accede para monitorear la iluminación de tus salones.">
      {formError ? <FormMessage type="error" message={formError} /> : null}

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
        autoComplete="current-password"
        placeholder="Tu contraseña"
        editable={!isSubmitting}
      />

      <Button label="Iniciar sesión" onPress={handleSubmit} loading={isSubmitting} />

      <View style={styles.footer}>
        <Text style={styles.footerText}>¿No tienes cuenta? </Text>
        <Link href="/register" style={styles.link}>
          Regístrate
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