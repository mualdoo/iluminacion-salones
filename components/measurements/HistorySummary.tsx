import { StyleSheet, Text } from 'react-native';

import { Card } from '@/components/dashboard/Card';
import { StatGrid, StatTile } from '@/components/stats/StatTile';
import { LIGHT_UNIT } from '@/constants/dashboard';
import { colors } from '@/constants/theme';
import { formatLevel } from '@/utils/analytics';

type Props = {
  count: number;
  lightCount: number;
  lightAverage: number | null;
  hasMore: boolean;
};

export function HistorySummary({ count, lightCount, lightAverage, hasMore }: Props) {
  return (
    <Card>
      <StatGrid>
        <StatTile label="Registros cargados" value={String(count)} hint={hasMore ? 'hay más al deslizar' : 'todos cargados'} />
        <StatTile
          label="Promedio de iluminación"
          value={formatLevel(lightAverage)}
          hint={lightCount > 0 ? `${LIGHT_UNIT} · ${lightCount} lectura${lightCount === 1 ? '' : 's'}` : 'sin lecturas de luz'}
        />
      </StatGrid>
      <Text style={styles.note}>Calculado sobre los registros cargados con el filtro activo.</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  note: { fontSize: 12, color: colors.textMuted },
});