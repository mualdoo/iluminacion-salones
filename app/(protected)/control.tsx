import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CommandList } from '@/components/control/CommandList';
import { ConfigurationCard } from '@/components/control/ConfigurationCard';
import { LampControlCard } from '@/components/control/LampControlCard';
import { AlertsSection } from '@/components/dashboard/AlertsSection';
import { ActiveDeviceBar } from '@/components/devices/ActiveDeviceBar';
import { EmptyState } from '@/components/EmptyState';
import { FormMessage } from '@/components/FormMessage';
import { ScreenContainer } from '@/components/ScreenContainer';
import { COMMANDS_POLL_MS } from '@/constants/control';
import { colors, spacing } from '@/constants/theme';
import { useDeviceCommands } from '@/hooks/useDeviceCommands';
import { useDeviceConfiguration } from '@/hooks/useDeviceConfiguration';
import { useDevices } from '@/hooks/useDevices';
import { useRealDashboard } from '@/hooks/useRealDashboard';
import type { LampCommandValue } from '@/types/control';
import type { Command } from '@/types/database';
import { describeCommand } from '@/utils/commands';
import { analyzeRealDevice } from '@/utils/deviceState';

type Feedback = { type: 'error' | 'success'; message: string } | null;

export default function ControlScreen() {
  const router = useRouter();
  const { activeDevice, isLoading: devicesLoading, refreshDevices } = useDevices();
  const deviceId = activeDevice?.id ?? null;

  const config = useDeviceConfiguration(deviceId);
  const commands = useDeviceCommands(deviceId, COMMANDS_POLL_MS);
  const real = useRealDashboard(deviceId);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  // Mantiene al día el estado y la última conexión del dispositivo.
  useFocusEffect(
    useCallback(() => {
      void refreshDevices();
    }, [refreshDevices]),
  );

  const goToDevices = () => router.navigate('/devices');

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refreshDevices(), config.refresh(), commands.refresh(), real.refresh()]);
    setIsRefreshing(false);
  };

  const handleSwitchToManual = async () => {
    if (!config.configuration) return;
    setFeedback(null);
    setIsSwitching(true);
    const result = await config.save({
      light_threshold: config.configuration.light_threshold,
      automatic_mode: false,
    });
    setIsSwitching(false);
    setFeedback(
      result.ok
        ? { type: 'success', message: 'Modo manual activado.' }
        : { type: 'error', message: result.message },
    );
  };

  const executeSend = async (value: LampCommandValue, switchToManualFirst: boolean) => {
    setFeedback(null);

    if (switchToManualFirst && config.configuration) {
      const switched = await config.save({
        light_threshold: config.configuration.light_threshold,
        automatic_mode: false,
      });
      if (!switched.ok) {
        setFeedback({ type: 'error', message: switched.message });
        return;
      }
    }

    const result = await commands.send(value);
    setFeedback(
      result.ok
        ? {
            type: 'success',
            message: `Comando de ${value === 'on' ? 'encendido' : 'apagado'} enviado. Quedará pendiente hasta que el dispositivo lo ejecute.`,
          }
        : { type: 'error', message: result.message },
    );
  };

  const handleSend = (value: LampCommandValue) => {
    if (config.configuration?.automatic_mode) {
      Alert.alert(
        'Modo automático activo',
        'El dispositivo decide por sí solo según el umbral y la presencia. ¿Qué quieres hacer?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Solo este comando', onPress: () => void executeSend(value, false) },
          { text: 'Cambiar a manual y enviar', onPress: () => void executeSend(value, true) },
        ],
      );
      return;
    }
    void executeSend(value, false);
  };

  const handleCancel = (command: Command) => {
    Alert.alert(
      'Cancelar comando',
      `¿Cancelar "${describeCommand(command)}"? Se eliminará de la cola y el dispositivo no lo ejecutará.`,
      [
        { text: 'Volver', style: 'cancel' },
        {
          text: 'Cancelar comando',
          style: 'destructive',
          onPress: async () => {
            setFeedback(null);
            const result = await commands.cancel(command.id);
            setFeedback(
              result.ok
                ? { type: 'success', message: 'Comando cancelado.' }
                : { type: 'error', message: result.message },
            );
          },
        },
      ],
    );
  };

  const renderConfiguration = () => {
    if (config.isLoading) {
      return <ActivityIndicator style={styles.loader} color={colors.textMuted} />;
    }
    if (config.configuration) {
      return (
        <ConfigurationCard
          key={config.configuration.device_id}
          configuration={config.configuration}
          isSaving={config.isSaving}
          onSave={config.save}
        />
      );
    }
    return (
      <EmptyState
        icon="settings-outline"
        title="Sin configuración"
        message={
          config.error ??
          'Este dispositivo no tiene una fila de configuración. Se crea automáticamente al registrar el dispositivo; si falta, elimínalo y vuelve a registrarlo.'
        }
      />
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
          message="Registra o elige un salón en la pestaña Dispositivos para controlar su luminaria."
          actionLabel="Ir a Dispositivos"
          onAction={goToDevices}
        />
      );
    }

    const { lamp, alerts } = analyzeRealDevice({
      device: activeDevice,
      data: real.data,
      configuration: config.configuration,
      commands: commands.commands,
      now: Date.now(),
    });

    return (
      <>
        {feedback ? <FormMessage type={feedback.type} message={feedback.message} /> : null}
        {commands.error ? <FormMessage type="error" message={commands.error} /> : null}

        <AlertsSection alerts={alerts} showWhenEmpty />

        <LampControlCard
          lamp={lamp}
          automaticMode={config.configuration ? config.configuration.automatic_mode : null}
          isSending={commands.isSending}
          isSwitching={isSwitching}
          onSend={handleSend}
          onSwitchToManual={handleSwitchToManual}
        />

        {renderConfiguration()}

        {commands.isLoading ? (
          <ActivityIndicator style={styles.loader} color={colors.textMuted} />
        ) : (
          <CommandList
            commands={commands.commands}
            busyId={commands.busyId}
            onCancel={handleCancel}
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
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      >
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Control</Text>
          <Text style={styles.subtitle}>
            Configura el modo y el umbral, y controla la luz del dispositivo activo.
          </Text>
        </View>

        <ActiveDeviceBar device={activeDevice} onManage={goToDevices} />

        {renderBody()}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, paddingBottom: spacing.xl },
  titleBlock: { gap: spacing.xs },
  title: { fontSize: 28, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 14, lineHeight: 20, color: colors.textMuted },
  loader: { marginTop: spacing.lg },
});