import { NOTIFICATION_EVENTS, defaultPreferences } from '@/features/settings/constants/notificationEvents'
import { delay } from '@/features/auth/services/fakeNetwork'
import { normalizeEmail } from '@/features/auth/data/accounts'
import type { NotificationPreferences } from '@/features/settings/types/preferences'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ATENÇÃO — aqui entra a API de preferências de notificação.
 *
 * O servidor é quem decide o que enviar; a matriz só registra a vontade da
 * pessoa. Mesmo que alguém force o envio de um canal obrigatório desligado,
 * o serviço o devolve ligado — a regra não depende da tela.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const stored = new Map<string, NotificationPreferences>()

/**
 * Cópia rasa por evento. Serve também à tela: `structuredClone` não copia o
 * objeto reativo que o Vue devolve, e uma cópia assim não depende disso.
 */
export function clonePreferences(preferences: NotificationPreferences): NotificationPreferences {
  return Object.fromEntries(
    Object.entries(preferences).map(([event, channels]) => [event, { ...channels }]),
  ) as NotificationPreferences
}

/** Liga de volta todo canal obrigatório, venha a matriz de onde vier. */
export function enforceLocked(preferences: NotificationPreferences): NotificationPreferences {
  const result = clonePreferences(preferences)
  for (const event of NOTIFICATION_EVENTS) {
    for (const channel of event.locked) result[event.id][channel] = true
  }
  return result
}

export async function fetchPreferences(email: string): Promise<NotificationPreferences> {
  await delay()
  return clonePreferences(stored.get(normalizeEmail(email)) ?? defaultPreferences())
}

export async function savePreferences(
  email: string,
  preferences: NotificationPreferences,
): Promise<NotificationPreferences> {
  await delay()
  const saved = enforceLocked(preferences)
  stored.set(normalizeEmail(email), saved)
  return clonePreferences(saved)
}
