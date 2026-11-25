import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { colors } from '@/constants/theme';
import { DeviceProvider } from '@/providers/DeviceProvider';

export default function ProtectedLayout() {
  return (
    <DeviceProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.warning,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: 'Panel',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? 'speedometer' : 'speedometer-outline'}
                size={size}
                color={String(color)}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="devices"
          options={{
            title: 'Dispositivos',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? 'hardware-chip' : 'hardware-chip-outline'}
                size={size}
                color={String(color)}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'Historial',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? 'time' : 'time-outline'}
                size={size}
                color={String(color)}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="control"
          options={{
            title: 'Control',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? 'toggle' : 'toggle-outline'}
                size={size}
                color={String(color)}
              />
            ),
          }}
        />
      </Tabs>
    </DeviceProvider>
  );
}