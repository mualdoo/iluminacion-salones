import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/dashboard/Card';
import { ActiveDeviceBar } from '@/components/devices/ActiveDeviceBar';
import { EmptyState } from '@/components/EmptyState';
import { FormMessage } from '@/components/FormMessage';
import { FilterChips } from '@/components/measurements/FilterChips';
import { ScreenContainer } from '@/components/ScreenContainer';
import { RecommendationsCard } from '@/components/stats/RecommendationsCard';
import { LampUsageCard, LightStatsCard, OccupancyStatsCard } from '@/components/stats/StatsSummaryCards';
import { TimeBandsCard } from '@/components/stats/TimeBandsCard';
import { ANALYTICS_MAX_ROWS, ANALYTICS_PERIODS } from '@/constants/analytics';
import { colors, radius, spacing } from '@/constants/theme';
import { useCsvExport } from '@/hooks/useCsvExport';
import { useDeviceAnalytics } from '@/hooks/useDeviceAnalytics';
import { useDeviceConfiguration } from '@/hooks/useDeviceConfiguration';
import { useDevices } from '@/hooks/useDevices';
import { exportMeasurementsCsv, exportSummaryCsv } from '@/services/export/csvExportService';
import type { AnalyticsPeriod } from '@/types/analytics';
import { computeDeviceStats, getPeriodLabel } from '@/utils/analytics';
import { generateDeviceRecommendations } from '@/utils/recommendations';

type ExportKind = 'history' | 'summary';

export default function StatsScreen() {
  const router = useRouter();
  const { activeDevice, isLoading: devicesLoading } = useDevices();
  const deviceId = activeDevice?.id ?? null;

  const [period, setPeriod] = useState<AnalyticsPeriod>('day');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [exportKind, setExportKind] = useState<ExportKind | null>(null);

  const analytics = useDeviceAnalytics(deviceId, period);
  const config = useDeviceConfiguration(deviceId);
  const exporter = useCsvExport();

  const configuration = config.configuration;
  const loading = analytics.isLoading || config.isLoading;

  const stats = useMemo(
    () =>
      analytics.data
        ? computeDeviceStats({
            measurements: analytics.data.measurements,
            commands: analytics.data.commands,
            threshold: configuration?.light_threshold ?? null,
            automaticMode: configuration ? configuration.automatic_mode : null,
          })
        : null,
    [analytics.data, configuration],
  );

  const recommendations = useMemo(
    () => (stats ? generateDeviceRecommendations({ stats, configuration }) : []),
    [stats, configuration],
  );

  const goToDevices = () => router.navigate('/devices');
  const goBack = () => (router.canGoBack() ? router.back() : router.navigate('/home'));

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([analytics.refresh(), config.refresh()]);
    setIsRefreshing(false);
  };

  const handleExportHistory = () => {
    const data = analytics.data;
    if (!activeDevice || !data) return;
    setExportKind('history');
    void exporter.run(() =>
      exportMeasurementsCsv(activeDevice.name, data.measurements, data.limitReached),
    );
  };

  const handleExportSummary = () => {
    const data = analytics.data;
    if (!activeDevice || !data || !stats) return;
    setExportKind('summary');
    void exporter.run(() =>
      exportSummaryCsv({
        device: activeDevice,
        periodLabel: getPeriodLabel(period),
        periodStart: data.periodStart,
        generatedAt: data.fetchedAt,
        limitReached: data.limitReached,
        stats,
        recommendations,
        configuration,
      }),
    );
  };

  const renderBody = () => {
    if (devicesLoading) {
      return <ActivityIndicator style={styles.loader} color={colors.textMuted} />;
    }
    if (!activeDevice) {
      return (
        <EmptyState
          icon="hardware-chip-outline"
          title="Selecciona un dispositivo"
          message="Registra o elige un salón en la pestaña Dispositivos para ver sus estadísticas."
          actionLabel="Ir a Dispositivos"
          onAction={goToDevices}
        />
      );
    }
    if (loading) {
      return <ActivityIndicator style={styles.loader} color={colors.textMuted} />;
    }
    if (!analytics.data || !stats) return null;

    const hasReadings = stats.totalReadings > 0;

    return (
      <>
        {analytics.data.limitReached ? (
          <View style={styles.notice}>
            <Ionicons name="alert-circle-outline" size={18} color={colors.warning} />
            <Text style={styles.noticeText}>
              Se alcanzó el límite de {ANALYTICS_MAX_ROWS} registros: los resultados cubren solo
              las mediciones más recientes del periodo.
            </Text>
          </View>
        ) : null}

        {hasReadings ? (
          <>
            <LightStatsCard light={stats.light} />
            <OccupancyStatsCard motion={stats.motion} />
            <LampUsageCard lamp={stats.lamp} light={stats.light} automaticMode={stats.automaticMode} />
            <TimeBandsCard bands={stats.bands} />
          </>
        ) : (
          <EmptyState
            icon="pulse-outline"
            title="Sin mediciones en este periodo"
            message="Este dispositivo no tiene mediciones en el periodo seleccionado. Prueba con un periodo más amplio."
          />
        )}

        <RecommendationsCard recommendations={recommendations} />

        <Card title="Exportar reportes" icon="download-outline">
          <Text style={styles.exportHint}>
            Genera un archivo CSV y elige dónde guardarlo o con qué app compartirlo.
          </Text>
          <Button
            label="Exportar historial de mediciones (CSV)"
            variant="secondary"
            onPress={handleExportHistory}
            loading={exporter.isExporting && exportKind === 'history'}
            disabled={exporter.isExporting}
          />
          <Button
            label="Exportar resumen estadístico (CSV)"
            variant="secondary"
            onPress={handleExportSummary}
            loading={exporter.isExporting && exportKind === 'summary'}
            disabled={exporter.isExporting}
          />
          {exporter.feedback ? (
            <FormMessage type={exporter.feedback.type} message={exporter.feedback.message} />
          ) : null}
        </Card>
      </>
    );
  };

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      >
        <Pressable
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
        >
          <Ionicons name="chevron-back" size={20} color={colors.text} />
          <Text style={styles.backLabel}>Volver</Text>
        </Pressable>

        <View style={styles.titleBlock}>
          <Text style={styles.title}>Estadísticas</Text>
          <Text style={styles.subtitle}>
            Ocupación, uso de iluminación y recomendaciones del dispositivo activo.
          </Text>
        </View>

        <ActiveDeviceBar device={activeDevice} onManage={goToDevices} />

        {activeDevice ? (
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Periodo</Text>
            <FilterChips options={ANALYTICS_PERIODS} value={period} onChange={setPeriod} />
          </View>
        ) : null}

        {analytics.error ? <FormMessage type="error" message={analytics.error} /> : null}

        {renderBody()}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, paddingBottom: spacing.xl },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  pressed: { opacity: 0.6 },
  backLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  titleBlock: { gap: spacing.xs },
  title: { fontSize: 28, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 14, lineHeight: 20, color: colors.textMuted },
  filterGroup: { gap: spacing.sm },
  filterLabel: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  loader: { marginTop: spacing.lg },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.warningSoft,
  },
  noticeText: { flex: 1, fontSize: 13, lineHeight: 18, color: colors.warning },
  exportHint: { fontSize: 13, lineHeight: 18, color: colors.textMuted },
});