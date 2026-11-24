import { StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/ScreenContainer';
import { StatusBadge } from '@/components/StatusBadge';
import { APP_DESCRIPTION, APP_NAME } from '@/constants/app';
import { colors, radius, spacing } from '@/constants/theme';

export default function WelcomeScreen() {
  return (
    <ScreenContainer>
      <View style={styles.center}>
        <View style={styles.card}>
          <Text style={styles.title}>{APP_NAME}</Text>
          <Text style={styles.description}>{APP_DESCRIPTION}</Text>
          <StatusBadge label="Aplicación funcionando" />
          <Text style={styles.phase}>Fase 1 · Estructura inicial</Text>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
    color: colors.textMuted,
  },
  phase: {
    fontSize: 13,
    color: colors.textMuted,
  },
});