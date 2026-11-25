import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { DeviceCard } from '@/components/devices/DeviceCard';
import { DeviceFormModal } from '@/components/devices/DeviceFormModal';
import { EmptyState } from '@/components/EmptyState';
import { FormMessage } from '@/components/FormMessage';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors, spacing } from '@/constants/theme';
import { useDevices } from '@/hooks/useDevices';
import type { Device } from '@/types/database';

type FormState = { mode: 'create' } | { mode: 'edit'; device: Device } | null;

export default function DevicesScreen() {
  const {
    devices,
    activeDevice,
    isLoading,
    error,
    selectDevice,
    refreshDevices,
    createDevice,
    updateDevice,
    deleteDevice,
  } = useDevices();

  const [formState, setFormState] = useState<FormState>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Mantiene el estado y la última conexión al día cada vez que se abre la pestaña.
  useFocusEffect(
    useCallback(() => {
      void refreshDevices();
    }, [refreshDevices]),
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshDevices();
    setIsRefreshing(false);
  };

  const handleDelete = (device: Device) => {
    Alert.alert(
      'Eliminar dispositivo',
      `¿Eliminar "${device.name}"? También se borrarán sus mediciones, configuración y comandos. Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setActionError(null);
            setBusyId(device.id);
            const result = await deleteDevice(device.id);
            setBusyId(null);
            if (!result.ok) setActionError(result.message);
          },
        },
      ],
    );
  };

  const header = (
    <View style={styles.header}>
      <View style={styles.titleBlock}>
        <Text style={styles.title}>Dispositivos</Text>
        <Text style={styles.subtitle}>
          Toca un dispositivo para usarlo como activo en el Panel, el Historial y Control.
        </Text>
      </View>
      <Button label="Registrar dispositivo" onPress={() => setFormState({ mode: 'create' })} />
      {error ? <FormMessage type="error" message={error} /> : null}
      {actionError ? <FormMessage type="error" message={actionError} /> : null}
    </View>
  );

  const empty = isLoading ? (
    <ActivityIndicator style={styles.loader} color={colors.textMuted} />
  ) : error ? null : (
    <EmptyState
      icon="hardware-chip-outline"
      title="Aún no tienes dispositivos"
      message="Registra tu primer salón para empezar a consultar sus mediciones."
      actionLabel="Registrar dispositivo"
      onAction={() => setFormState({ mode: 'create' })}
    />
  );

  return (
    <ScreenContainer>
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.content}
        data={devices}
        extraData={`${activeDevice?.id ?? ''}|${busyId ?? ''}`}
        keyExtractor={(device) => device.id}
        renderItem={({ item }) => (
          <DeviceCard
            device={item}
            isActive={item.id === activeDevice?.id}
            isBusy={busyId === item.id}
            onSelect={() => selectDevice(item.id)}
            onEdit={() => setFormState({ mode: 'edit', device: item })}
            onDelete={() => handleDelete(item)}
          />
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={() => empty}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      />

      {formState ? (
        <DeviceFormModal
          mode={formState.mode}
          initialValues={
            formState.mode === 'edit'
              ? {
                  name: formState.device.name,
                  description: formState.device.description ?? '',
                }
              : undefined
          }
          onSubmit={(input) =>
            formState.mode === 'edit'
              ? updateDevice(formState.device.id, input)
              : createDevice(input)
          }
          onClose={() => setFormState(null)}
        />
      ) : null}
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
  separator: { height: spacing.md },
  loader: { marginTop: spacing.xl },
});