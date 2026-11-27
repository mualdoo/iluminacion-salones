import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/dashboard/Card';
import { StatePill } from '@/components/dashboard/StatePill';
import { colors, spacing } from '@/constants/theme';
import type { Recommendation } from '@/types/analytics';
import { RECOMMENDATION_META } from '@/utils/recommendations';

type Props = {
  recommendation: Recommendation | null;
  onPress: () => void;
};

export function StatsLinkCard({ recommendation, onPress }: Props) {
  const meta = recommendation ? RECOMMENDATION_META[recommendation.category] : null;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Ver estadísticas y recomendaciones"
      style={({ pressed }) => (pressed ? styles.pressed : undefined)}
    >
      <Card>
        <View style={styles.row}>
          <View style={styles.iconCircle}>
            <Ionicons name="stats-chart" size={22} color={colors.textMuted} />
          </View>
          <View style={styles.texts}>
            <Text style={styles.title}>Ver estadísticas y recomendaciones</Text>
            <Text style={styles.subtitle}>Ocupación, uso de iluminación y reportes CSV.</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </View>

        {recommendation && meta ? (
          <View style={styles.reco}>
            <StatePill label={`Recomendación · ${meta.label}`} tone={meta.tone} icon={meta.icon} />
            <Text style={styles.recoTitle}>{recommendation.title}</Text>
            <Text style={styles.recoText} numberOfLines={3}>
              {recommendation.explanation}
            </Text>
          </View>
        ) : null}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 4 },
  iconCircle: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.neutralSoft,
  },
  texts: { flex: 1, gap: 2 },
  title: { fontSize: 15, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 12, color: colors.textMuted },
  reco: {
    gap: spacing.xs + 2,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  recoTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  recoText: { fontSize: 13, lineHeight: 18, color: colors.textMuted },
});