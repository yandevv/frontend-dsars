import { computed, ref, type Ref } from 'vue'

import { DEMO_TEAM_NOTIFICATIONS, DEMO_TITULAR_NOTIFICATIONS } from '@/features/notifications/data/notifications'
import { DEMO_ACCOUNTS, normalizeEmail } from '@/features/auth/data/accounts'
import { uuidv7 } from '@/shared/utils/uuid'
import type { Account } from '@/features/auth/types/auth'
import type { AppNotification, NewNotification } from '@/features/notifications/types/notification'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ATENÇÃO — aqui entra a API de notificações.
 *
 * Cada conta lê só a própria caixa. O titular tem a dele; quem atende a
 * organização compartilha a caixa da equipe, porque a fila também é
 * compartilhada. Enquanto não há servidor, as caixas vivem em memória e os
 * serviços de requisição depositam nelas os avisos que o servidor enviaria.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** A caixa compartilhada por quem atende requisições na organização. */
export const TEAM_INBOX = 'equipe'

export function titularInbox(email: string): string {
  return `titular:${normalizeEmail(email)}`
}

export function inboxOf(account: Pick<Account, 'role' | 'email'>): string {
  return account.role === 'encarregado' ? TEAM_INBOX : titularInbox(account.email)
}

const inboxes = new Map<string, Ref<AppNotification[]>>()

function seed(key: string): AppNotification[] {
  if (key === TEAM_INBOX) return DEMO_TEAM_NOTIFICATIONS.map((item) => ({ ...item }))
  const demoTitular = DEMO_ACCOUNTS.find((account) => account.role === 'titular' && account.emailConfirmed)
  if (demoTitular && key === titularInbox(demoTitular.email)) {
    return DEMO_TITULAR_NOTIFICATIONS.map((item) => ({ ...item }))
  }
  return []
}

function inbox(key: string): Ref<AppNotification[]> {
  let box = inboxes.get(key)
  if (!box) {
    box = ref(seed(key))
    inboxes.set(key, box)
  }
  return box
}

/** Deposita um aviso na caixa de alguém — o que o servidor faria a cada evento. */
export function notify(key: string, notification: NewNotification): void {
  const box = inbox(key)
  box.value = [
    { ...notification, id: uuidv7(), at: new Date().toISOString(), unread: true },
    ...box.value,
  ]
}

/** Volta todas as caixas ao estado de demonstração. Existe para os testes. */
export function resetNotifications(): void {
  inboxes.clear()
}

/**
 * Os avisos de quem está na tela.
 *
 * O cabeçalho e a página de notificações leem a mesma caixa: marcar como lida
 * de um lado baixa o contador do outro na hora.
 */
export function useNotifications(account: Pick<Account, 'role' | 'email'>) {
  const box = inbox(inboxOf(account))

  /** Mais recentes primeiro, sempre. */
  const notifications = computed(() => [...box.value].sort((a, b) => b.at.localeCompare(a.at)))
  const unreadCount = computed(() => box.value.filter((item) => item.unread).length)

  function markAsRead(id: string) {
    box.value = box.value.map((item) => (item.id === id ? { ...item, unread: false } : item))
  }

  function markAllAsRead() {
    box.value = box.value.map((item) => ({ ...item, unread: false }))
  }

  /**
   * Limpa a listagem desta conta. É só a exibição: o registro dos eventos
   * continua na trilha de auditoria das requisições.
   */
  function clear() {
    box.value = []
  }

  return { notifications, unreadCount, markAsRead, markAllAsRead, clear }
}
