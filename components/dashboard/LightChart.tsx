import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/dashboard/Card';
import { MAX_LIGHT_LEVEL } from '@/constants/dashboard';
import { colors, spacing, tones } from '@/constants/theme';
import type { LightSample } from '@/types/dashboard';
import { LIGHT_BANDS, formatClock, getLightBand } from '@/utils/dashboard';

const CHART_HEIGHT = 140;
const Y_AXIS_WIDTH = 34;
const Y_TICKS = [MAX_LIGHT_LEVEL, MAX_LIGHT_LEVEL / 2, 0];
const LABEL_WIDTH = 56;
const LABEL_EVERY = 4;

type Props = {
  samples: LightSample[];
};

export function LightChart({ samples }: Props) {
  const lastIndex = samples.length - 1;

  return (
    <Card title="Historial de iluminación" icon="stats-chart-outline">

      {samples.length === 0 ? (
        <Text style={styles.empty}>Aún no hay mediciones de iluminación para graficar.</Text>
      ) : (
        <View style={styles.chartWrapper}>
          <View style={styles.chartRow}>
            <View style={styles.yAxis}>
              {Y_TICKS.map((tick) => (
                <Text key={tick} style={styles.axisLabel}>
                  {tick}
                </Text>
              ))}
            </View>

            <View style={styles.plot}>
              {Y_TICKS.map((tick) => (
                <View
                  key={tick}
                  style={[styles.gridLine, { bottom: (tick / MAX_LIGHT_LEVEL) * CHART_HEIGHT }]}
                />
              ))}
              <View style={styles.bars}>
                {samples.map((sample, index) => {
                  const value = Math.min(MAX_LIGHT_LEVEL, Math.max(0, sample.value));
                  const height = Math.max(2, (value / MAX_LIGHT_LEVEL) * CHART_HEIGHT);
                  return (
                    <View key={`${index}-${sample.timestamp}`} style={styles.barSlot}>
                      <View
                        style={[
                          styles.bar,
                          { height, backgroundColor: tones[getLightBand(value).tone].fg },
                        ]}
                      />
                    </View>
                  );
                })}
              </View>
            </View>
          </View>

          <View style={styles.xRow}>
            {samples.map((sample, index) => (
              <View key={`${index}-${sample.timestamp}`} style={styles.xSlot}>
                {(lastIndex - index) % LABEL_EVERY === 0 ? (
                  <Text style={styles.xLabel} numberOfLines={1}>
                    {formatClock(sample.timestamp)}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.legend}>
        {LIGHT_BANDS.map((band) => (
          <View key={band.label} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: tones[band.tone].fg }]} />
            <Text style={styles.legendText}>
              {band.label}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  subtitle: { fontSize: 12, color: colors.textMuted },
  empty: { fontSize: 14, color: colors.textMuted },
  chartWrapper: { paddingRight: 12, gap: spacing.xs },
  chartRow: { flexDirection: 'row', gap: spacing.sm },
  yAxis: {
    width: Y_AXIS_WIDTH,
    height: CHART_HEIGHT,
    justifyContent: 'space-between',
  },
  axisLabel: { fontSize: 10, textAlign: 'right', color: colors.textMuted },
  plot: { flex: 1, height: CHART_HEIGHT },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.border,
  },
  bars: { flex: 1, flexDirection: 'row' },
  barSlot: {
    flex: 1,
    height: CHART_HEIGHT,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  bar: { width: '100%', maxWidth: 22, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  xRow: {
    flexDirection: 'row',
    marginLeft: Y_AXIS_WIDTH + spacing.sm,
    height: 16,
  },
  xSlot: { flex: 1 },
  xLabel: {
    position: 'absolute',
    top: 2,
    left: '50%',
    width: LABEL_WIDTH,
    marginLeft: -LABEL_WIDTH / 2,
    textAlign: 'center',
    fontSize: 10,
    color: colors.textMuted,
  },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: colors.textMuted },
});