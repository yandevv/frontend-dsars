import { describe, it, expect, beforeEach } from 'vitest'

import { destinationOf, resetNotifications, toNotification, useNotifications } from '../useNotifications'
import { mockApi, problem, route } from '@/test/api'
import { isoFromNow } from '@/test/factories'
import type { ApiNotification } from '@/shared/api/contracts'

function apiNotification(overrides: Partial<ApiNotification> = {}): ApiNotification {
  return {
    id: 'n1',
    eventType: 'REQUEST_MESSAGE_RECEIVED',
    title: 'Nova mensagem na 2026-000101',
    body: 'Abra a requisição para ler.',
    resourceType: 'Request',
    resourceId: 'r1',
    read: false,
    readAt: null,
    createdAt: isoFromNow(-60_000),
    ...overrides,
  }
}

function inbox(items: ApiNotification[], unread = items.filter((item) => !item.read).length) {
  return [
    route('GET', '/me/notifications', { items, page: 1, pageSize: 20, total: items.length }),
    route('GET', '/me/notifications/unread-count', { unreadCount: unread }),
  ]
}

beforeEach(() => {
  resetNotifications()
})

describe('useNotifications', () => {
  it('traduz o evento da API para o rótulo e o tom da lista', () => {
    expect(toNotification(apiNotification({ eventType: 'REQUEST_DEADLINE_EXPIRED' }))).toMatchObject({
      type: 'Prazo vencido',
      tone: 'alerta',
      unread: true,
      hasTarget: true,
    })
  })

  it('carrega a primeira página e o contador de não lidas', async () => {
    mockApi(inbox([apiNotification(), apiNotification({ id: 'n2', read: true })]))
    const { notifications, unreadCount, load } = useNotifications()

    await load()

    expect(notifications.value).toHaveLength(2)
    expect(unreadCount.value).toBe(1)
  })

  it('compartilha o estado entre o cabeçalho e a página', async () => {
    mockApi([...inbox([apiNotification()]), route('POST', '/me/notifications/read-all', {})])
    const header = useNotifications()
    const page = useNotifications()

    await header.load()
    await page.markAllAsRead()

    expect(header.unreadCount.value).toBe(0)
    expect(header.notifications.value[0]!.unread).toBe(false)
  })

  it('limpa a listagem pela API', async () => {
    const api = mockApi([...inbox([apiNotification()]), route('DELETE', '/me/notifications', {})])
    const { notifications, load, clear } = useNotifications()

    await load()
    await clear()

    expect(notifications.value).toEqual([])
    expect(api.calls.some((call) => call.method === 'DELETE')).toBe(true)
  })

  it('abre o recurso conforme o perfil de quem está na tela', async () => {
    mockApi([
      ...inbox([apiNotification()]),
      route('POST', '/me/notifications/n1/open', {
        resourceType: 'Request',
        resourceId: 'r1',
        path: '/requisicoes/r1',
      }),
    ])
    const { notifications, load, open, unreadCount } = useNotifications()
    await load()

    const destination = await open(notifications.value[0]!, 'encarregado')

    expect(destination).toEqual({
      kind: 'rota',
      to: { name: 'request-detail', params: { id: 'r1' } },
    })
    expect(unreadCount.value).toBe(0)
  })

  it('explica no próprio aviso quando o recurso não existe mais', async () => {
    mockApi([
      ...inbox([apiNotification()]),
      route('POST', '/me/notifications/n1/open', problem(410, 'Esta requisição não está mais disponível.')),
    ])
    const { notifications, load, open } = useNotifications()
    await load()

    const destination = await open(notifications.value[0]!, 'titular')

    expect(destination).toEqual({
      kind: 'indisponivel',
      reason: 'Esta requisição não está mais disponível.',
    })
    expect(notifications.value[0]).toMatchObject({
      unread: false,
      hasTarget: false,
      unavailableReason: 'Esta requisição não está mais disponível.',
    })
  })

  it('leva os avisos de segurança às configurações', () => {
    expect(
      destinationOf({ resourceType: 'User', resourceId: 'conta-1', path: null }, 'titular'),
    ).toEqual({ kind: 'rota', to: { name: 'security-settings' } })
    expect(destinationOf({ resourceType: null, resourceId: null, path: null }, 'titular')).toEqual({
      kind: 'nenhum',
    })
  })
})
