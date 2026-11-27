import { Stack } from 'expo-router';

import { DeviceProvider } from '@/providers/DeviceProvider';

export default function ProtectedLayout() {
  return (
    <DeviceProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="stats" />
      </Stack>
    </DeviceProvider>
  );
}