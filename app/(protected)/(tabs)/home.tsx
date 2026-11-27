import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet } from 'react-native';

import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { RealDashboardContent } from '@/components/dashboard/RealDashboardContent';
import { RealDataBar } from '@/components/dashboard/RealDataBar';
import { ActiveDeviceBar } from '@/components/devices/ActiveDeviceBar';
import { EmptyState } from '@/components/EmptyState';
import { FormMessage } from '@/components/FormMessage';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useDeviceAnalytics } from '@/hooks/useDeviceAnalytics';
import { useDeviceCommands } from '@/hooks/useDeviceCommands';
import { useDeviceConfiguration } from '@/hooks/useDeviceConfiguration';
import { useDevices } from '@/hooks/useDevices';
import { useRealDashboard } from '@/hooks/useRealDashboard';
import { signOut } from '@/services/auth/authService';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { activeDevice, isLoading: devicesLoading, refreshDevices } = useDevices();
  const deviceId = activeDevice?.id ?? null;

  const real = useRealDashboard(deviceId);
  const configuration = useDeviceConfiguration(deviceId);
  const commands = useDeviceCommands(deviceId);
  const analytics = useDeviceAnalytics(deviceId, 'day');

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  // Mantiene al día el estado y la última conexión del dispositivo.
  useFocusEffect(
    useCallback(() => {
      void refreshDevices();
    }, [refreshDevices]),
  );

  const goToDevices = () => router.navigate('/devices');

  const refreshAll = async () => {
    setIsRefreshing(true);
    await Promise.all([
      refreshDevices(),
      real.refresh(),
      configuration.refresh(),
      commands.refresh(),
      analytics.refresh(),
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

  const renderBody = () => {
    if (devicesLoading) {
      return <ActivityIndicator style={styles.loader} color={colors.textMuted} />;
    }

    if (!activeDevice) {
      return (
        <EmptyState
          icon="hardware-chip-outline"
          title="Selecciona un dispositivo"
          message="Registra o elige un salón en la pestaña Dispositivos para ver sus mediciones."
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
          onRefresh={refreshAll}
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
            message="Este dispositivo aún no tiene mediciones. Cuando el ESP32 las envíe, aparecerán aquí."
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
          activeDevice ? <RefreshControl refreshing={isRefreshing} onRefresh={refreshAll} /> : undefined
        }
      >
        <DashboardHeader email={user?.email} onSignOut={handleSignOut} isSigningOut={isSigningOut} />

        {signOutError ? <FormMessage type="error" message={signOutError} /> : null}

        <ActiveDeviceBar device={activeDevice} onManage={goToDevices} />

        {real.error ? <FormMessage type="error" message={real.error} /> : null}

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
});