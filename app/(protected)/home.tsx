import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { LampCard } from '@/components/dashboard/LampCard';
import { LightChart } from '@/components/dashboard/LightChart';
import { LightLevelCard } from '@/components/dashboard/LightLevelCard';
import { MotionCard } from '@/components/dashboard/MotionCard';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { RoomStatusSection } from '@/components/dashboard/RoomStatusSection';
import { SimulationBar } from '@/components/dashboard/SimulationBar';
import { FormMessage } from '@/components/FormMessage';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors, radius, spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useMockDashboard } from '@/hooks/useMockDashboard';
import { signOut } from '@/services/auth/authService';

export default function HomeScreen() {
  const { user } = useAuth();
  const { snapshot, refresh } = useMockDashboard();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const handleSignOut = async () => {
    setSignOutError(null);
    setIsSigningOut(true);
    const result = await signOut();
    setIsSigningOut(false);
    // Si salió bien, la sesión pasa a null y la app regresa al login automáticamente.
    if (!result.ok) setSignOutError(result.message);
  };

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <DashboardHeader email={user?.email} onSignOut={handleSignOut} isSigningOut={isSigningOut} />

        {signOutError ? <FormMessage type="error" message={signOutError} /> : null}

        <SimulationBar updatedAt={snapshot.updatedAt} onRefresh={refresh} />

        {snapshot.connection === 'disconnected' ? (
          <View style={styles.notice}>
            <Ionicons name="alert-circle-outline" size={18} color={colors.warning} />
            <Text style={styles.noticeText}>
              Sin conexión con el dispositivo (simulado). Se muestran los últimos valores
              recibidos.
            </Text>
          </View>
        ) : null}

        <RoomStatusSection
          occupied={snapshot.occupied}
          lampOn={snapshot.lampOn}
          connection={snapshot.connection}
        />
        <LightLevelCard level={snapshot.lightLevel} />
        <MotionCard motionDetected={snapshot.motionDetected} occupied={snapshot.occupied} />
        <LampCard lampOn={snapshot.lampOn} mode={snapshot.mode} />
        <LightChart samples={snapshot.history} />
        <RecentActivity events={snapshot.events} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xl,
  },
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