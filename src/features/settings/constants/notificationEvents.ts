import type { NotificationChannel } from '@/features/settings/types/preferences'

/**
 * Os canais da matriz, na ordem das colunas. Os eventos e as regras de cada
 * canal vêm do servidor, que é quem decide o que é obrigatório.
 */
export const NOTIFICATION_CHANNELS: readonly {
  id: NotificationChannel
  label: string
  note: string
}[] = [
  { id: 'email', label: 'E-mail', note: 'Sempre entregue' },
  { id: 'portal', label: 'No portal', note: 'Sino e listagem' },
]
