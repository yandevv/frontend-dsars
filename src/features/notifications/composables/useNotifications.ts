import { computed, ref } from 'vue'

import { EVENT_PRESENTATION } from '@/features/notifications/constants/eventTypes'
import { http } from '@/shared/api/http'
import { isApiError, messageOf } from '@/shared/api/ApiError'
import type { AccountRole } from '@/features/auth/types/auth'
import type { ApiNotification, ApiNotificationTarget, Page } from '@/shared/api/contracts'
import type {
  AppNotification,
  NotificationDestination,
} from '@/features/notifications/types/notification'

/**
 * Os avisos de quem está na tela (RF023 a RF027).
 *
 * O estado é um só para a aplicação inteira: o cabeçalho e a página de
 * notificações leem a mesma lista, e marcar como lida de um lado baixa o
 * contador do outro na hora. O contador é relido do servidor a cada minuto e
 * sempre que a janela volta ao foco.
 */

const PAGE_SIZE = 20
const POLL_MS = 60_000

const items = ref<AppNotification[]>([])
const unread = ref(0)
const total = ref(0)
const page = ref(0)
const loading = ref(false)
const loaded = ref(false)
let polling: ReturnType<typeof setInterval> | undefined

export function toNotification(item: ApiNotification): AppNotification {
  const presentation = EVENT_PRESENTATION[item.eventType] ?? { type: 'Aviso', tone: 'neutro' }
  return {
    id: item.id,
    type: presentation.type,
    tone: presentation.tone,
    title: item.title,
    detail: item.body,
    at: item.createdAt,
    hasTarget: item.resourceType !== null && item.resourceId !== null,
    unread: !item.read,
  }
}

async function refreshUnread(): Promise<void> {
  try {
    const { unreadCount } = await http.get<{ unreadCount: number }>(
      '/me/notifications/unread-count',
    )
    unread.value = unreadCount
  } catch {
    // O contador é informativo: uma falha momentânea não merece aviso.
  }
}

async function loadPage(next: number): Promise<void> {
  loading.value = true
  try {
    const result = await http.get<Page<ApiNotification>>('/me/notifications', {
      query: { page: next, pageSize: PAGE_SIZE },
    })
    const mapped = result.items.map(toNotification)
    items.value = next === 1 ? mapped : [...items.value, ...mapped]
    total.value = result.total
    page.value = next
    loaded.value = true
  } finally {
    loading.value = false
  }
}

function startPolling(): void {
  if (polling !== undefined || typeof window === 'undefined') return
  polling = setInterval(() => void refreshUnread(), POLL_MS)
  window.addEventListener('focus', () => void refreshUnread())
}

/** Para onde leva um recurso, conforme o perfil de quem abre o aviso. */
export function destinationOf(
  target: ApiNotificationTarget,
  role: AccountRole,
): NotificationDestination {
  if (target.resourceType === 'Request' && target.resourceId) {
    return {
      kind: 'rota',
      to: {
        name: role === 'encarregado' ? 'request-detail' : 'my-request-detail',
        params: { id: target.resourceId },
      },
    }
  }
  if (target.resourceType === 'User') return { kind: 'rota', to: { name: 'security-settings' } }
  return { kind: 'nenhum' }
}

/** Esvazia o estado — ao sair da conta, para a próxima não ver os avisos da anterior. */
export function resetNotifications(): void {
  items.value = []
  unread.value = 0
  total.value = 0
  page.value = 0
  loaded.value = false
}

export function useNotifications() {
  startPolling()

  const notifications = computed(() => items.value)
  const unreadCount = computed(() => unread.value)
  const hasMore = computed(() => items.value.length < total.value)

  /** Primeira página e contador; chamado pelo cabeçalho e pela página. */
  async function load(): Promise<void> {
    await Promise.all([loadPage(1), refreshUnread()])
  }

  async function loadMore(): Promise<void> {
    if (!hasMore.value || loading.value) return
    await loadPage(page.value + 1)
  }

  function markLocally(id: string) {
    const target = items.value.find((item) => item.id === id)
    if (target?.unread) {
      items.value = items.value.map((item) => (item.id === id ? { ...item, unread: false } : item))
      unread.value = Math.max(0, unread.value - 1)
    }
  }

  async function markAsRead(id: string): Promise<void> {
    markLocally(id)
    try {
      await http.patch(`/me/notifications/${id}/read`)
    } finally {
      await refreshUnread()
    }
  }

  async function markAllAsRead(): Promise<void> {
    items.value = items.value.map((item) => ({ ...item, unread: false }))
    unread.value = 0
    await http.post('/me/notifications/read-all')
  }

  /**
   * Limpa a listagem desta conta. É só a exibição: o registro dos eventos
   * continua na trilha de auditoria.
   */
  async function clear(): Promise<void> {
    await http.delete('/me/notifications')
    items.value = []
    total.value = 0
    unread.value = 0
  }

  /**
   * Abre o aviso: o servidor o marca como lido e diz a que recurso ele leva.
   * Recurso que sumiu responde 410, e a explicação vai para o próprio aviso.
   */
  async function open(item: AppNotification, role: AccountRole): Promise<NotificationDestination> {
    try {
      const target = await http.post<ApiNotificationTarget>(`/me/notifications/${item.id}/open`)
      markLocally(item.id)
      return destinationOf(target, role)
    } catch (error) {
      if (isApiError(error, 410)) {
        markLocally(item.id)
        const reason = messageOf(error)
        items.value = items.value.map((entry) =>
          entry.id === item.id ? { ...entry, unavailableReason: reason, hasTarget: false } : entry,
        )
        return { kind: 'indisponivel', reason }
      }
      throw error
    }
  }

  return {
    notifications,
    unreadCount,
    hasMore,
    loading: computed(() => loading.value),
    loaded: computed(() => loaded.value),
    load,
    loadMore,
    markAsRead,
    markAllAsRead,
    clear,
    open,
  }
}
