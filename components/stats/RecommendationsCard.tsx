import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/dashboard/Card';
import { StatePill } from '@/components/dashboard/StatePill';
import { colors, spacing, tones } from '@/constants/theme';
import type { Recommendation } from '@/types/analytics';
import { RECOMMENDATION_META } from '@/utils/recommendations';

export function RecommendationsCard({ recommendations }: { recommendations: Recommendation[] }) {
  return (
    <Card title="Recomendaciones" icon="sparkles-outline">
      <View>
        {recommendations.map((rec, index) => {
          const meta = RECOMMENDATION_META[rec.category];
          const palette = tones[meta.tone];
          return (
            <View
              key={rec.id}
              style={[styles.row, index < recommendations.length - 1 && styles.divider]}
            >
              <View style={[styles.iconCircle, { backgroundColor: palette.bg }]}>
                <Ionicons name={meta.icon} size={20} color={palette.fg} />
              </View>
              <View style={styles.texts}>
                <StatePill label={meta.label} tone={meta.tone} />
                <Text style={styles.title}>{rec.title}</Text>
                <Text style={styles.explanation}>{rec.explanation}</Text>
                <Text style={styles.action}>
                  <Text style={styles.actionLabel}>Acción sugerida: </Text>
                  {rec.action}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm + 4,
    paddingVertical: spacing.sm + 2,
  },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  iconCircle: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  texts: { flex: 1, gap: spacing.xs + 2 },
  title: { fontSize: 15, fontWeight: '700', color: colors.text },
  explanation: { fontSize: 13, lineHeight: 18, color: colors.textMuted },
  action: { fontSize: 13, lineHeight: 18, color: colors.text },
  actionLabel: { fontWeight: '700' },
});