import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/constants/theme';

type Props = {
  type: 'error' | 'success';
  message: string;
};

export function FormMessage({ type, message }: Props) {
  const isError = type === 'error';

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.box, isError ? styles.errorBox : styles.successBox]}
    >
      <Text style={[styles.text, isError ? styles.errorText : styles.successText]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { padding: spacing.md, borderRadius: radius.md },
  errorBox: { backgroundColor: colors.errorSoft },
  successBox: { backgroundColor: colors.successSoft },
  text: { fontSize: 14, lineHeight: 20 },
  errorText: { color: colors.error },
  successText: { color: colors.success },
});