import { describe, it, expect, beforeEach, vi } from 'vitest'

import {
  TEAM_INBOX,
  inboxOf,
  notify,
  resetNotifications,
  titularInbox,
  useNotifications,
} from '../useNotifications'
import { DEMO_REQUESTS } from '@/features/requests/data/requests'
import { answerRequest, cancelRequests, sendMessage } from '@/features/requests/services/requestService'

vi.mock('@/features/auth/services/fakeNetwork', () => ({ delay: () => Promise.resolve() }))

const TITULAR = { role: 'titular' as const, email: 'titular@exemplo.com.br' }
const TEAM = { role: 'encarregado' as const, email: 'helena.vasconcelos@meridianosaude.org.br' }
const idOf = (protocol: string) => DEMO_REQUESTS.find((item) => item.protocol === protocol)!.id

beforeEach(() => {
  resetNotifications()
})

describe('useNotifications', () => {
  it('separa a caixa de cada titular e compartilha a da equipe', () => {
    expect(inboxOf(TITULAR)).toBe(titularInbox('Titular@Exemplo.com.br'))
    expect(inboxOf(TEAM)).toBe(TEAM_INBOX)
    expect(inboxOf({ role: 'encarregado', email: 'outra@meridianosaude.org.br' })).toBe(TEAM_INBOX)

    expect(useNotifications(TITULAR).notifications.value.length).toBeGreaterThan(0)
    expect(useNotifications({ role: 'titular', email: 'nova@exemplo.com.br' }).notifications.value).toEqual([])
  })

  it('mostra as mais recentes primeiro', () => {
    const { notifications } = useNotifications(TITULAR)
    const dates = notifications.value.map((item) => item.at)

    expect(dates).toEqual([...dates].sort().reverse())
  })

  it('marca uma como lida e o contador cai para todos que leem a mesma caixa', () => {
    const header = useNotifications(TITULAR)
    const page = useNotifications(TITULAR)
    const before = header.unreadCount.value
    const unread = page.notifications.value.find((item) => item.unread)!

    page.markAsRead(unread.id)

    expect(header.unreadCount.value).toBe(before - 1)
  })

  it('marca todas como lidas só na própria caixa', () => {
    useNotifications(TITULAR).markAllAsRead()

    expect(useNotifications(TITULAR).unreadCount.value).toBe(0)
    expect(useNotifications(TEAM).unreadCount.value).toBeGreaterThan(0)
  })

  it('limpar esvazia só a listagem de quem limpou', () => {
    useNotifications(TEAM).clear()

    expect(useNotifications(TEAM).notifications.value).toEqual([])
    expect(useNotifications(TITULAR).notifications.value.length).toBeGreaterThan(0)
  })

  it('um aviso novo entra no topo, como não lido', () => {
    notify(TEAM_INBOX, {
      type: 'Nova requisição',
      tone: 'neutro',
      title: 'Aviso de teste',
      detail: 'Detalhe.',
    })

    const [first] = useNotifications(TEAM).notifications.value
    expect(first).toMatchObject({ title: 'Aviso de teste', unread: true })
  })
})

describe('avisos que os serviços enviam à outra parte', () => {
  it('a mensagem da equipe chega ao titular, e a do titular chega à equipe', async () => {
    const titular = useNotifications(TITULAR)
    const team = useNotifications(TEAM)

    await sendMessage(idOf('2026-000447'), {
      text: 'Pode confirmar o endereço?',
      actor: { name: 'Helena Prado Vasconcelos', role: 'encarregado' },
    })
    expect(titular.notifications.value[0]?.title).toContain('A equipe escreveu na requisição 2026-000447')

    await sendMessage(idOf('2026-000447'), {
      text: 'Confirmo.',
      actor: { name: 'Marina Torres de Almeida', role: 'titular' },
    })
    expect(team.notifications.value[0]?.title).toContain('Nova mensagem do titular na 2026-000447')
  })

  it('a conclusão avisa o titular e manda o convite da pesquisa', async () => {
    await answerRequest(idOf('2026-000444'), {
      outcome: 'atendido',
      text: 'Removemos o consentimento das listas de mensagens.',
      attachments: [{ name: 'comprovante.pdf', meta: 'PDF' }],
    })

    const [survey, done] = useNotifications(TITULAR).notifications.value
    expect(done?.type).toBe('Requisição concluída')
    expect(survey?.type).toBe('Pesquisa de satisfação')
    expect(survey?.target).toMatchObject({ query: { pesquisa: '1' } })
  })

  it('o cancelamento avisa a equipe', async () => {
    await cancelRequests([idOf('2026-000418')], 'Resolvi direto com a unidade.')

    expect(useNotifications(TEAM).notifications.value[0]?.title).toBe(
      'O titular cancelou o protocolo 2026-000418',
    )
  })
})
