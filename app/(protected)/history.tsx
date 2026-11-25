import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { ActiveDeviceBar } from '@/components/devices/ActiveDeviceBar';
import { EmptyState } from '@/components/EmptyState';
import { FormMessage } from '@/components/FormMessage';
import { FilterChips } from '@/components/measurements/FilterChips';
import { MeasurementItem } from '@/components/measurements/MeasurementItem';
import { ScreenContainer } from '@/components/ScreenContainer';
import { TIME_RANGES, TYPE_FILTERS } from '@/constants/measurements';
import { colors, spacing } from '@/constants/theme';
import { useDevices } from '@/hooks/useDevices';
import { useMeasurements } from '@/hooks/useMeasurements';
import type { MeasurementTypeFilter, TimeRangeKey } from '@/types/measurements';

export default function HistoryScreen() {
  const router = useRouter();
  const { activeDevice, isLoading: devicesLoading } = useDevices();
  const [type, setType] = useState<MeasurementTypeFilter>('all');
  const [range, setRange] = useState<TimeRangeKey>('day');

  const measurements = useMeasurements(activeDevice?.id ?? null, type, range);
  const goToDevices = () => router.navigate('/devices');

  const filtersActive = type !== 'all' || range !== 'all';

  const header = (
    <View style={styles.header}>
      <View style={styles.titleBlock}>
        <Text style={styles.title}>Historial</Text>
        <Text style={styles.subtitle}>
          Mediciones guardadas en Supabase para el dispositivo activo.
        </Text>
      </View>

      <ActiveDeviceBar device={activeDevice} onManage={goToDevices} />

      {activeDevice ? (
        <>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Tipo de medición</Text>
            <FilterChips options={TYPE_FILTERS} value={type} onChange={setType} />
          </View>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Rango de tiempo</Text>
            <FilterChips options={TIME_RANGES} value={range} onChange={setRange} />
          </View>
          {measurements.error ? <FormMessage type="error" message={measurements.error} /> : null}
          {!measurements.isLoading && measurements.items.length > 0 ? (
            <Text style={styles.count}>
              Mostrando {measurements.items.length} medición
              {measurements.items.length === 1 ? '' : 'es'}
              {measurements.hasMore ? ' (desliza para ver más)' : ''}
            </Text>
          ) : null}
        </>
      ) : null}
    </View>
  );

  let empty = null;
  if (devicesLoading || measurements.isLoading) {
    empty = <ActivityIndicator style={styles.loader} color={colors.textMuted} />;
  } else if (activeDevice && !measurements.error) {
    empty = (
      <EmptyState
        icon="pulse-outline"
        title="Sin mediciones"
        message={
          filtersActive
            ? 'No hay mediciones con los filtros seleccionados. Prueba con otro tipo o un rango más amplio.'
            : 'Este dispositivo aún no tiene mediciones guardadas.'
        }
      />
    );
  }

  return (
    <ScreenContainer>
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.content}
        data={measurements.items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MeasurementItem measurement={item} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={header}
        ListEmptyComponent={() => empty}
        ListFooterComponent={() =>
            measurements.isLoadingMore ? (
                <ActivityIndicator style={styles.footer} color={colors.textMuted} />
            ) : null
        }
        onEndReached={measurements.loadMore}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl refreshing={measurements.isRefreshing} onRefresh={measurements.refresh} />
        }
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  content: { paddingBottom: spacing.xl },
  header: { gap: spacing.md, marginBottom: spacing.md },
  titleBlock: { gap: spacing.xs },
  title: { fontSize: 28, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 14, lineHeight: 20, color: colors.textMuted },
  filterGroup: { gap: spacing.sm },
  filterLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  count: { fontSize: 12, color: colors.textMuted },
  separator: { height: spacing.sm },
  loader: { marginTop: spacing.xl },
  footer: { marginVertical: spacing.md },
});