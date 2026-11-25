import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AlertsSection } from '@/components/dashboard/AlertsSection';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { LampCard } from '@/components/dashboard/LampCard';
import { LightChart } from '@/components/dashboard/LightChart';
import { LightLevelCard } from '@/components/dashboard/LightLevelCard';
import { MotionCard } from '@/components/dashboard/MotionCard';
import { RealDashboardContent } from '@/components/dashboard/RealDashboardContent';
import { RealDataBar } from '@/components/dashboard/RealDataBar';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { RoomStatusSection } from '@/components/dashboard/RoomStatusSection';
import { SimulationBar } from '@/components/dashboard/SimulationBar';
import { SourceSwitch } from '@/components/dashboard/SourceSwitch';
import { ActiveDeviceBar } from '@/components/devices/ActiveDeviceBar';
import { EmptyState } from '@/components/EmptyState';
import { FormMessage } from '@/components/FormMessage';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SIMULATED_LIGHT_THRESHOLD } from '@/constants/control';
import { colors, radius, spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useDeviceCommands } from '@/hooks/useDeviceCommands';
import { useDeviceConfiguration } from '@/hooks/useDeviceConfiguration';
import { useDevices } from '@/hooks/useDevices';
import { useMockDashboard } from '@/hooks/useMockDashboard';
import { useRealDashboard } from '@/hooks/useRealDashboard';
import { signOut } from '@/services/auth/authService';
import type { DataSource } from '@/types/measurements';
import { evaluateDeviceAlerts } from '@/utils/alerts';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { activeDevice, isLoading: devicesLoading, refreshDevices } = useDevices();
  const deviceId = activeDevice?.id ?? null;

  const real = useRealDashboard(deviceId);
  const configuration = useDeviceConfiguration(deviceId);
  const commands = useDeviceCommands(deviceId);

  // null = automático: datos reales si el dispositivo activo tiene mediciones; si no, simulación.
  const [sourcePref, setSourcePref] = useState<DataSource | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const waitingForRealData = !devicesLoading && sourcePref === null && real.isLoading;
  const source: DataSource = sourcePref ?? (real.data?.hasData ? 'real' : 'simulated');

  // El simulador (y su intervalo) solo existe cuando se está mostrando.
  const mock = useMockDashboard(source === 'simulated' && !devicesLoading && !waitingForRealData);

  // Mantiene al día el estado y la última conexión del dispositivo.
  useFocusEffect(
    useCallback(() => {
      void refreshDevices();
    }, [refreshDevices]),
  );

  const goToDevices = () => router.navigate('/devices');

  const refreshReal = async () => {
    setIsRefreshing(true);
    await Promise.all([
      refreshDevices(),
      real.refresh(),
      configuration.refresh(),
      commands.refresh(),
    ]);
    setIsRefreshing(false);
  };

  const handleSignOut = async () => {
    setSignOutError(null);
    setIsSigningOut(true);
    const result = await signOut();
    setIsSigningOut(false);
    // Si salió bien, la sesión pasa a null y la app regresa al login automáticamente.
    if (!result.ok) setSignOutError(result.message);
  };

  const { snapshot } = mock;
  const showRealError = real.error && (source === 'real' || sourcePref === null);

  const renderBody = () => {
    if (devicesLoading || waitingForRealData) {
      return <ActivityIndicator style={styles.loader} color={colors.textMuted} />;
    }

    if (source === 'simulated') {
      const simulatedAlerts = evaluateDeviceAlerts({
        now: Date.now(),
        deviceStatus: snapshot.connection === 'connected' ? 'online' : 'offline',
        lastSeenAt: null,
        lightLevel: snapshot.lightLevel,
        lightThreshold: SIMULATED_LIGHT_THRESHOLD,
        occupied: snapshot.occupied,
        lampOn: snapshot.lampOn,
        lampPending: false,
        automaticMode: snapshot.mode === 'automatic',
        pendingCommandDates: [],
      });

      return (
        <>
          <SimulationBar updatedAt={snapshot.updatedAt} onRefresh={mock.refresh} />

          {snapshot.connection === 'disconnected' ? (
            <View style={styles.notice}>
              <Ionicons name="alert-circle-outline" size={18} color={colors.warning} />
              <Text style={styles.noticeText}>
                Sin conexión con el dispositivo (simulado). Se muestran los últimos valores recibidos.
              </Text>
            </View>
          ) : null}

          <AlertsSection alerts={simulatedAlerts} />

          <RoomStatusSection
            occupied={snapshot.occupied}
            lampOn={snapshot.lampOn}
            connection={snapshot.connection}
          />
          <LightLevelCard level={snapshot.lightLevel} />
          <MotionCard motionDetected={snapshot.motionDetected} occupied={snapshot.occupied} />
          <LampCard lampOn={snapshot.lampOn} mode={snapshot.mode} />
          <LightChart samples={snapshot.history} />
          <RecentActivity events={snapshot.events} alerts={simulatedAlerts} />
        </>
      );
    }

    // Datos reales
    if (!activeDevice) {
      return (
        <EmptyState
          icon="hardware-chip-outline"
          title="Selecciona un dispositivo"
          message="Registra o elige un salón en la pestaña Dispositivos para ver sus mediciones reales."
          actionLabel="Ir a Dispositivos"
          onAction={goToDevices}
        />
      );
    }

    if (!real.data) {
      return real.error ? null : (
        <ActivityIndicator style={styles.loader} color={colors.textMuted} />
      );
    }

    const lastMeasurementAt = real.data.recent[0]
      ? new Date(real.data.recent[0].recorded_at).getTime()
      : null;

    return (
      <>
        <RealDataBar
          lastMeasurementAt={lastMeasurementAt}
          isRefreshing={isRefreshing}
          onRefresh={refreshReal}
        />
        {real.data.hasData ? (
          <RealDashboardContent
            data={real.data}
            device={activeDevice}
            configuration={configuration.configuration}
            commands={commands.commands}
          />
        ) : (
          <EmptyState
            icon="pulse-outline"
            title="Sin mediciones todavía"
            message="Este dispositivo aún no tiene mediciones en Supabase. Cuando el ESP32 las envíe, aparecerán aquí. Mientras tanto puedes usar los datos simulados."
          />
        )}
      </>
    );
  };

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          source === 'real' && activeDevice ? (
            <RefreshControl refreshing={isRefreshing} onRefresh={refreshReal} />
          ) : undefined
        }
      >
        <DashboardHeader email={user?.email} onSignOut={handleSignOut} isSigningOut={isSigningOut} />

        {signOutError ? <FormMessage type="error" message={signOutError} /> : null}

        <ActiveDeviceBar device={activeDevice} onManage={goToDevices} />
        <SourceSwitch value={source} onChange={setSourcePref} />

        {showRealError ? <FormMessage type="error" message={real.error ?? ''} /> : null}

        {renderBody()}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
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
});