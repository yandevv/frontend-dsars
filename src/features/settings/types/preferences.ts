import type { ApiNotificationEvent } from '@/shared/api/contracts'

/** Por onde um aviso pode chegar. */
export type NotificationChannel = 'email' | 'portal'

/** Um canal de um evento, como o servidor o descreve. */
export interface ChannelSetting {
  enabled: boolean
  /** Obrigatório neste canal: aparece travado, sempre ligado. */
  mandatory: boolean
}

/** Um evento notificável e os canais em que ele sai (RF020 / RF021). */
export interface PreferenceEvent {
  id: ApiNotificationEvent
  label: string
  description: string
  /** Só os canais em que o evento pode sair; os outros ficam de fora. */
  channels: Partial<Record<NotificationChannel, ChannelSetting>>
}

/** Ligado ou desligado, por evento e por canal — cada canal é independente. */
export type NotificationPreferences = Record<string, Partial<Record<NotificationChannel, boolean>>>
