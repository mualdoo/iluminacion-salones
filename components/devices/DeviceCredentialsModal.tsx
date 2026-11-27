import * as Clipboard from 'expo-clipboard';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { FormMessage } from '@/components/FormMessage';
import { colors, radius, spacing } from '@/constants/theme';
import { useDevices } from '@/hooks/useDevices';
import type { DeviceTokenResult } from '@/services/devices/deviceService';
import type { Device } from '@/types/database';

type Props = {
  device: Device;
  onClose: () => void;
};

type CopyTarget = 'id' | 'token';

type TokenState = {
  loading: boolean;
  result: DeviceTokenResult | null;
  error: string | null;
};

const MASK = '•'.repeat(32);

// Se monta solo cuando se abre, así el estado inicial siempre es el correcto.
export function DeviceCredentialsModal({ device, onClose }: Props) {
  const { getDeviceToken } = useDevices();
  const [tokenState, setTokenState] = useState<TokenState>({
    loading: true,
    result: null,
    error: null,
  });
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState<CopyTarget | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setTokenState({ loading: true, result: null, error: null });
    const result = await getDeviceToken(device.id);
    setTokenState(
      result.ok
        ? { loading: false, result: result.data, error: null }
        : { loading: false, result: null, error: result.message },
    );
  }, [device.id, getDeviceToken]);

  useEffect(() => {
    void load();
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [load]);

  const copy = async (value: string, target: CopyTarget) => {
    setCopyError(null);
    try {
      await Clipboard.setStringAsync(value);
      setCopied(target);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopyError('No se pudo copiar al portapapeles. Inténtalo de nuevo.');
    }
  };

  const token = tokenState.result?.status === 'available' ? tokenState.result.token : null;
  const alreadyProvisioned = tokenState.result?.status === 'already_provisioned';

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.sheet}>
            <Text style={styles.title}>Credenciales ESP32</Text>
            <Text style={styles.subtitle}>{device.name}</Text>

            {copyError ? <FormMessage type="error" message={copyError} /> : null}

            <View style={styles.group}>
              <Text style={styles.label}>DEVICE_ID</Text>
              <View style={styles.valueBox}>
                <Text style={styles.value} selectable>
                  {device.id}
                </Text>
              </View>
              <Button
                label={copied === 'id' ? '¡Copiado!' : 'Copiar ID'}
                variant="secondary"
                onPress={() => copy(device.id, 'id')}
              />
            </View>

            <View style={styles.group}>
              <Text style={styles.label}>DEVICE_TOKEN</Text>

              {tokenState.loading ? (
                <ActivityIndicator color={colors.textMuted} />
              ) : tokenState.error ? (
                <>
                  <FormMessage type="error" message={tokenState.error} />
                  <Button label="Reintentar" variant="secondary" onPress={load} />
                </>
              ) : token ? (
                <>
                  <View style={styles.valueBox}>
                    <Text style={styles.value} selectable={revealed}>
                      {revealed ? token : MASK}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <View style={styles.flex}>
                      <Button
                        label={revealed ? 'Ocultar' : 'Mostrar'}
                        variant="secondary"
                        onPress={() => setRevealed((value) => !value)}
                      />
                    </View>
                    <View style={styles.flex}>
                      <Button
                        label={copied === 'token' ? '¡Copiado!' : 'Copiar Token'}
                        variant="secondary"
                        onPress={() => copy(token, 'token')}
                      />
                    </View>
                  </View>
                  <Text style={styles.note}>
                    Pega estos valores en firmware/esp32_iluminacion/secrets.h y cárgalos en tu
                    ESP32. Quien tenga el token puede enviar mediciones como este dispositivo:
                    no lo compartas.
                  </Text>
                </>
              ) : alreadyProvisioned ? (
                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>
                    Este dispositivo ya tiene un token configurado en el servidor. Por seguridad
                    solo se muestra una vez, cuando se genera, y no puede recuperarse. Usa el
                    Device ID de arriba junto con el token que ya configuraste. Para un
                    dispositivo nuevo, el token se mostrará aquí automáticamente.
                  </Text>
                </View>
              ) : null}
            </View>

            <Button label="Cerrar" onPress={onClose} />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.45)' },
  scroll: { flexGrow: 1, justifyContent: 'flex-start', padding: spacing.lg, paddingTop: 72 },
  sheet: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 14, color: colors.textMuted },
  group: { gap: spacing.sm },
  label: { fontSize: 13, fontWeight: '700', color: colors.text },
  valueBox: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.neutralSoft,
  },
  value: { fontSize: 13, lineHeight: 19, fontFamily: 'monospace', color: colors.text },
  row: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
  note: { fontSize: 12, lineHeight: 17, color: colors.textMuted },
  infoBox: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.infoSoft,
  },
  infoText: { fontSize: 13, lineHeight: 18, color: colors.info },
});