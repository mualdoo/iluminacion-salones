import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { FormMessage } from '@/components/FormMessage';
import { ScreenContainer } from '@/components/ScreenContainer';
import { StatusBadge } from '@/components/StatusBadge';
import { colors, radius, spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { signOut } from '@/services/auth/authService';

export default function HomeScreen() {
  const { user } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignOut = async () => {
    setError(null);
    setIsSigningOut(true);
    const result = await signOut();
    setIsSigningOut(false);
    // Si salió bien, la sesión pasa a null y la app regresa al login automáticamente.
    if (!result.ok) setError(result.message);
  };

  return (
    <ScreenContainer>
      <View style={styles.center}>
        <View style={styles.card}>
          <Text style={styles.title}>¡Bienvenido!</Text>
          <Text style={styles.label}>Sesión iniciada como</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <StatusBadge label="Autenticación funcionando" />
          <Text style={styles.note}>
            Esta es una pantalla provisional. El dashboard llegará en fases posteriores.
          </Text>
          {error ? <FormMessage type="error" message={error} /> : null}
          <Button
            label="Cerrar sesión"
            variant="secondary"
            onPress={handleSignOut}
            loading={isSigningOut}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center' },
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { fontSize: 28, fontWeight: '700', color: colors.text },
  label: { fontSize: 13, color: colors.textMuted },
  email: { fontSize: 18, fontWeight: '600', color: colors.text },
  note: { fontSize: 14, lineHeight: 20, color: colors.textMuted },
});