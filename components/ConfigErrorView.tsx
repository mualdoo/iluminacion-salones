import { StyleSheet, Text } from 'react-native';

import { ScreenContainer } from '@/components/ScreenContainer';
import { colors, spacing } from '@/constants/theme';

export function ConfigErrorView() {
  return (
    <ScreenContainer>
      <Text style={styles.title}>Falta configurar Supabase</Text>
      <Text style={styles.text}>
        Crea un archivo .env a partir de .env.example, completa EXPO_PUBLIC_SUPABASE_URL y
        EXPO_PUBLIC_SUPABASE_ANON_KEY, y reinicia con "pnpm start --clear".
      </Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '700', color: colors.text, marginTop: spacing.xl },
  text: { fontSize: 16, lineHeight: 22, color: colors.textMuted, marginTop: spacing.md },
});