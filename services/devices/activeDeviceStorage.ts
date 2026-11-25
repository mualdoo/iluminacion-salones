import * as SecureStore from 'expo-secure-store';

// Las claves de SecureStore solo admiten letras, números, ".", "-" y "_".
const storageKey = (userId: string) => `active_device_id.${userId}`;

export async function loadActiveDeviceId(userId: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(storageKey(userId));
  } catch {
    return null;
  }
}

export async function saveActiveDeviceId(userId: string, deviceId: string | null): Promise<void> {
  try {
    if (deviceId) {
      await SecureStore.setItemAsync(storageKey(userId), deviceId);
    } else {
      await SecureStore.deleteItemAsync(storageKey(userId));
    }
  } catch {
    // Recordar el dispositivo activo es una comodidad: si falla, no se interrumpe la app.
  }
}