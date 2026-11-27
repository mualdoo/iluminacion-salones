import { COMMAND_TYPE_SET_LIGHT } from '@/constants/control';
import type { Tone } from '@/constants/theme';
import type { Command, CommandStatus } from '@/types/database';
import type { IconName } from '@/types/ui';

export const COMMAND_STATUS_META: Record<
  CommandStatus,
  { label: string; tone: Tone; icon: IconName }
> = {
  pending: { label: 'Pendiente', tone: 'warning', icon: 'time-outline' },
  executed: { label: 'Ejecutado', tone: 'success', icon: 'checkmark-circle' },
  failed: { label: 'Fallido', tone: 'error', icon: 'close-circle' },
};

type CommandLike = Pick<Command, 'command_type' | 'value'>;

export function describeCommand(command: CommandLike): string {
  if (command.command_type === COMMAND_TYPE_SET_LIGHT) {
    if (command.value === 'on') return 'Encender luz';
    if (command.value === 'off') return 'Apagar luz';
  }
  return command.value ? `${command.command_type}: ${command.value}` : command.command_type;
}

export function commandIcon(command: CommandLike): IconName {
  if (command.command_type === COMMAND_TYPE_SET_LIGHT) {
    return command.value === 'on' ? 'bulb' : 'bulb-outline';
  }
  return 'terminal-outline';
}