import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { APP_NAME } from '@/constants/app';
import { colors, radius, spacing } from '@/constants/theme';

type Props = {
  email: string | undefined;
  onSignOut: () => void;
  isSigningOut: boolean;
};

export function DashboardHeader({ email, onSignOut, isSigningOut }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.brand}>
          <View style={styles.logo}>
            <Ionicons name="bulb" size={22} color={colors.primary} />
          </View>
          <Text style={styles.title}>{APP_NAME}</Text>
        </View>

        <Pressable
          onPress={onSignOut}
          disabled={isSigningOut}
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesión"
          style={({ pressed }) => [styles.signOut, (pressed || isSigningOut) && styles.dimmed]}
        >
          {isSigningOut ? (
            <ActivityIndicator size="small" color={colors.text} />
          ) : (
            <Ionicons name="log-out-outline" size={18} color={colors.text} />
          )}
          <Text style={styles.signOutLabel}>Salir</Text>
        </Pressable>
      </View>

      <View style={styles.greeting}>
        <Text style={styles.greetingLabel}>Hola, sesión iniciada como</Text>
        <Text style={styles.email} numberOfLines={1} ellipsizeMode="middle">
          {email ?? '—'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  brand: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
  },
  logo: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.warningSoft,
  },
  title: {
    flexShrink: 1,
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    height: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  signOutLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  dimmed: { opacity: 0.6 },
  greeting: { gap: 2 },
  greetingLabel: { fontSize: 13, color: colors.textMuted },
  email: { fontSize: 16, fontWeight: '600', color: colors.text },
});