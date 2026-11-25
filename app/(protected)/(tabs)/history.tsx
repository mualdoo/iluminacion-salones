import { useRouter } from 'expo-router';
import { useMemo, useState, type ReactElement } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { ActiveDeviceBar } from '@/components/devices/ActiveDeviceBar';
import { EmptyState } from '@/components/EmptyState';
import { FormMessage } from '@/components/FormMessage';
import { FilterChips } from '@/components/measurements/FilterChips';
import { HistorySummary } from '@/components/measurements/HistorySummary';
import { MeasurementItem } from '@/components/measurements/MeasurementItem';
import { ScreenContainer } from '@/components/ScreenContainer';
import { EXPORT_MAX_ROWS } from '@/constants/analytics';
import { LIGHT_VALUE_FILTERS, MOTION_VALUE_FILTERS, SORT_OPTIONS } from '@/constants/history';
import { TIME_RANGES, TYPE_FILTERS } from '@/constants/measurements';
import { colors, spacing } from '@/constants/theme';
import { useCsvExport } from '@/hooks/useCsvExport';
import { useDeviceConfiguration } from '@/hooks/useDeviceConfiguration';
import { useDevices } from '@/hooks/useDevices';
import { useMeasurements } from '@/hooks/useMeasurements';
import { exportMeasurementsCsv } from '@/services/export/csvExportService';
import { fetchMeasurementsForExport } from '@/services/measurements/measurementService';
import type { SortOrder, ValueFilter } from '@/types/history';
import type { MeasurementTypeFilter, TimeRangeKey } from '@/types/measurements';
import { summarizeMeasurements } from '@/utils/analytics';
import { getRangeStart } from '@/utils/measurements';

export default function HistoryScreen() {
  const router = useRouter();
  const { activeDevice, isLoading: devicesLoading } = useDevices();
  const deviceId = activeDevice?.id ?? null;

  const [type, setType] = useState<MeasurementTypeFilter>('all');
  const [range, setRange] = useState<TimeRangeKey>('day');
  const [valueFilter, setValueFilter] = useState<ValueFilter>('all');
  const [sort, setSort] = useState<SortOrder>('desc');

  const config = useDeviceConfiguration(deviceId);
  const threshold = config.configuration?.light_threshold ?? null;

  const measurements = useMeasurements(deviceId, { type, range, valueFilter, sort, threshold });
  const exporter = useCsvExport();

  const summary = useMemo(() => summarizeMeasurements(measurements.items), [measurements.items]);

  const goToDevices = () => router.navigate('/devices');
  const goToStats = () => router.navigate('/stats');

  const handleTypeChange = (next: MeasurementTypeFilter) => {
    setType(next);
    setValueFilter('all'); // el filtro de valor depende del tipo
  };

  const handleExport = () => {
    if (!activeDevice) return;
    const device = activeDevice;
    void exporter.run(async () => {
      const fetched = await fetchMeasurementsForExport(
        {
          deviceId: device.id,
          type,
          valueFilter,
          threshold,
          since: getRangeStart(range),
          ascending: sort === 'asc',
        },
        EXPORT_MAX_ROWS,
      );
      if (!fetched.ok) return fetched;
      return exportMeasurementsCsv(device.name, fetched.data.rows, fetched.data.truncated);
    });
  };

  const filtersActive = type !== 'all' || range !== 'all' || valueFilter !== 'all';

  // El filtro de valor solo aplica a un tipo concreto. "Bajo/sobre umbral" necesita conocer el umbral.
  const valueOptions =
    type === 'light' ? (threshold !== null ? LIGHT_VALUE_FILTERS : null) : type === 'motion' ? MOTION_VALUE_FILTERS : null;

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
          <View style={styles.actions}>
            <Button label="Ver estadísticas" variant="secondary" onPress={goToStats} />
            <Button
              label="Exportar historial (CSV)"
              variant="secondary"
              onPress={handleExport}
              loading={exporter.isExporting}
            />
          </View>
          {exporter.feedback ? (
            <FormMessage type={exporter.feedback.type} message={exporter.feedback.message} />
          ) : null}

          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Tipo de medición</Text>
            <FilterChips options={TYPE_FILTERS} value={type} onChange={handleTypeChange} />
          </View>
          {valueOptions ? (
            <View style={styles.filterGroup}>
              <Text style={styles.filterLabel}>
                {type === 'light' ? 'Nivel respecto al umbral' : 'Estado del movimiento'}
              </Text>
              <FilterChips options={valueOptions} value={valueFilter} onChange={setValueFilter} />
            </View>
          ) : null}
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Rango de tiempo</Text>
            <FilterChips options={TIME_RANGES} value={range} onChange={setRange} />
          </View>
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Orden</Text>
            <FilterChips options={SORT_OPTIONS} value={sort} onChange={setSort} />
          </View>

          {measurements.error ? <FormMessage type="error" message={measurements.error} /> : null}
          {!measurements.isLoading && measurements.items.length > 0 ? (
            <HistorySummary
              count={summary.count}
              lightCount={summary.lightCount}
              lightAverage={summary.lightAverage}
              hasMore={measurements.hasMore}
            />
          ) : null}
        </>
      ) : null}
    </View>
  );

  let empty: ReactElement | null = null;
  if (devicesLoading || measurements.isLoading) {
    empty = <ActivityIndicator style={styles.loader} color={colors.textMuted} />;
  } else if (activeDevice && !measurements.error) {
    empty = (
      <EmptyState
        icon="pulse-outline"
        title="Sin mediciones"
        message={
          filtersActive
            ? 'No hay mediciones con los filtros seleccionados. Prueba con otro tipo, otro filtro o un rango más amplio.'
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
  actions: { gap: spacing.sm },
  filterGroup: { gap: spacing.sm },
  filterLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  separator: { height: spacing.sm },
  loader: { marginTop: spacing.xl },
  footer: { marginVertical: spacing.md },
});