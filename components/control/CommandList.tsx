import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/dashboard/Card';
import { StatePill } from '@/components/dashboard/StatePill';
import { colors, radius, spacing } from '@/constants/theme';
import type { Command } from '@/types/database';
import { COMMAND_STATUS_META, commandIcon, describeCommand } from '@/utils/commands';
import { formatDateTime } from '@/utils/format';

type Props = {
  commands: Command[];
  busyId: string | null;
  onCancel: (command: Command) => void;
};

export function CommandList({ commands, busyId, onCancel }: Props) {
  return (
    <Card title="Comandos recientes" icon="list-outline">
      {commands.length === 0 ? (
        <Text style={styles.empty}>Aún no has enviado comandos a este dispositivo.</Text>
      ) : (
        <View>
          {commands.map((command, index) => {
            const status = COMMAND_STATUS_META[command.status];
            const isPending = command.status === 'pending';
            const isBusy = busyId === command.id;
            return (
              <View
                key={command.id}
                style={[styles.row, index < commands.length - 1 && styles.divider]}
              >
                <View style={styles.iconCircle}>
                  <Ionicons name={commandIcon(command)} size={20} color={colors.textMuted} />
                </View>
                <View style={styles.texts}>
                  <Text style={styles.title}>{describeCommand(command)}</Text>
                  <Text style={styles.time}>Creado: {formatDateTime(command.created_at)}</Text>
                  {command.executed_at ? (
                    <Text style={styles.time}>
                      {command.status === 'failed' ? 'Intento' : 'Ejecutado'}:{' '}
                      {formatDateTime(command.executed_at)}
                    </Text>
                  ) : null}
                  <View style={styles.statusRow}>
                    <StatePill label={status.label} tone={status.tone} icon={status.icon} />
                    {isPending ? (
                      <Pressable
                        onPress={() => onCancel(command)}
                        disabled={isBusy}
                        accessibilityRole="button"
                        accessibilityLabel={`Cancelar ${describeCommand(command)}`}
                        style={({ pressed }) => [styles.cancel, (pressed || isBusy) && styles.dimmed]}
                      >
                        {isBusy ? (
                          <ActivityIndicator size="small" color={colors.error} />
                        ) : (
                          <Ionicons name="close-circle-outline" size={16} color={colors.error} />
                        )}
                        <Text style={styles.cancelLabel}>Cancelar</Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  empty: { fontSize: 14, color: colors.textMuted },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm + 4,
    paddingVertical: spacing.sm + 2,
  },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  iconCircle: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: colors.neutralSoft,
  },
  texts: { flex: 1, gap: 2 },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  time: { fontSize: 12, color: colors.textMuted },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  cancel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    height: 32,
    paddingHorizontal: spacing.sm + 4,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cancelLabel: { fontSize: 13, fontWeight: '600', color: colors.error },
  dimmed: { opacity: 0.6 },
});