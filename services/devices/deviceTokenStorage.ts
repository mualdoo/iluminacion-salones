import * as SecureStore from 'expo-secure-store';

// Las claves de SecureStore solo admiten letras, números, ".", "-" y "_" (un UUID es válido).
const storageKey = (deviceId: string) => `device_token.${deviceId}`;

export async function getStoredDeviceToken(deviceId: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(storageKey(deviceId));
  } catch {
    return null;
  }
}

/** Devuelve false si no se pudo guardar (el token se mostrará, pero no se podrá volver a ver). */
export async function saveDeviceToken(deviceId: string, token: string): Promise<boolean> {
  try {
    await SecureStore.setItemAsync(storageKey(deviceId), token);
    return true;
  } catch {
    return false;
  }
}

export async function removeDeviceToken(deviceId: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(storageKey(deviceId));
  } catch {
    // Si falla, el token queda huérfano en el almacenamiento local; no se interrumpe la app.
  }
}