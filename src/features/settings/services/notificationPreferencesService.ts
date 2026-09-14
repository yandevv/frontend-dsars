import { http } from '@/shared/api/http'
import type { ApiEventPreference, ApiNotificationChannel } from '@/shared/api/contracts'
import type {
  NotificationChannel,
  NotificationPreferences,
  PreferenceEvent,
} from '@/features/settings/types/preferences'

/**
 * Preferências de notificação (RF020 / RF021).
 *
 * O servidor devolve o catálogo de eventos do perfil, com os canais em que
 * cada um sai e quais são obrigatórios. A matriz só registra a vontade da
 * pessoa: mesmo que alguém force o desligamento de um canal obrigatório, o
 * servidor o recusa — a regra não depende da tela.
 */

const CHANNEL: Record<ApiNotificationChannel, NotificationChannel> = {
  EMAIL: 'email',
  IN_APP: 'portal',
}

const API_CHANNEL: Record<NotificationChannel, ApiNotificationChannel> = {
  email: 'EMAIL',
  portal: 'IN_APP',
}

export interface PreferenceMatrix {
  events: PreferenceEvent[]
  preferences: NotificationPreferences
}

function toMatrix(events: ApiEventPreference[]): PreferenceMatrix {
  const mapped = events.map<PreferenceEvent>((event) => ({
    id: event.eventType,
    label: event.label,
    description: event.description,
    channels: Object.fromEntries(
      event.channels.map((channel) => [
        CHANNEL[channel.channel],
        { enabled: channel.enabled, mandatory: channel.mandatory },
      ]),
    ),
  }))
  return { events: mapped, preferences: preferencesOf(mapped) }
}

/** A matriz ligada/desligada, lida do catálogo. */
export function preferencesOf(events: readonly PreferenceEvent[]): NotificationPreferences {
  return Object.fromEntries(
    events.map((event) => [
      event.id,
      Object.fromEntries(
        Object.entries(event.channels).map(([channel, setting]) => [channel, setting.enabled]),
      ),
    ]),
  )
}

/**
 * Cópia rasa por evento. Serve também à tela: `structuredClone` não copia o
 * objeto reativo que o Vue devolve, e uma cópia assim não depende disso.
 */
export function clonePreferences(preferences: NotificationPreferences): NotificationPreferences {
  return Object.fromEntries(
    Object.entries(preferences).map(([event, channels]) => [event, { ...channels }]),
  )
}

/** O padrão do portal: tudo ligado, como uma conta nova começa. */
export function defaultPreferences(events: readonly PreferenceEvent[]): NotificationPreferences {
  return Object.fromEntries(
    events.map((event) => [
      event.id,
      Object.fromEntries(Object.keys(event.channels).map((channel) => [channel, true])),
    ]),
  )
}

export async function fetchPreferences(): Promise<PreferenceMatrix> {
  const { events } = await http.get<{ events: ApiEventPreference[] }>(
    '/me/notification-preferences',
  )
  return toMatrix(events)
}

/** Envia só as células opcionais: as obrigatórias o servidor mantém ligadas. */
export async function savePreferences(
  events: readonly PreferenceEvent[],
  preferences: NotificationPreferences,
): Promise<PreferenceMatrix> {
  const changes = events.flatMap((event) =>
    Object.entries(event.channels)
      .filter(([, setting]) => !setting.mandatory)
      .map(([channel]) => ({
        eventType: event.id,
        channel: API_CHANNEL[channel as NotificationChannel],
        enabled: preferences[event.id]?.[channel as NotificationChannel] ?? true,
      })),
  )
  const { events: saved } = await http.put<{ events: ApiEventPreference[] }>(
    '/me/notification-preferences',
    { preferences: changes },
  )
  return toMatrix(saved)
}
