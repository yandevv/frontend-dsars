import { describe, it, expect, vi, beforeEach } from 'vitest'

import { LEGAL_DEADLINE_DAYS } from '@/features/requests/constants/requestPolicy'
import { OnBehalfRuleError, fetchRequest, registerOnBehalf } from '../requestService'
import { deadlineStatusOf } from '@/features/requests/utils/deadline'
import { daysUntil } from '@/shared/utils/date'
import { todayInput } from '@/features/requests/utils/onBehalf'
import {
  resetNotifications,
  useNotifications,
} from '@/features/notifications/composables/useNotifications'
import type { OnBehalfRequest } from '@/features/requests/types/request'

vi.mock('@/features/auth/services/fakeNetwork', () => ({ delay: () => Promise.resolve() }))

const AUTHOR = 'Helena Prado Vasconcelos'

function daysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return todayInput(date)
}

function input(overrides: Partial<OnBehalfRequest> = {}): OnBehalfRequest {
  return {
    subject: {
      name: 'Wagner Sipriano Melo',
      cpf: '318.902.774-10',
      email: '',
      phone: '(31) 98812-4407',
      hasAccount: false,
    },
    identityVerified: true,
    channel: 'carta',
    receivedOn: daysAgo(3),
    reference: 'Carta nº 219/2026',
    rightNumeral: 'VI',
    description: 'Carta assinada pedindo a exclusão dos dados usados em campanhas.',
    attachments: [],
    ...overrides,
  }
}

describe('registerOnBehalf', () => {
  beforeEach(() => resetNotifications())

  it('registra com o rastro de quem registrou e por onde o pedido chegou', async () => {
    const receipt = await registerOnBehalf(input(), AUTHOR)
    const created = await fetchRequest(receipt.id)

    expect(created.origin).toMatchObject({
      channel: 'carta',
      reference: 'Carta nº 219/2026',
      registeredBy: AUTHOR,
    })
    expect(created.assignee).toBe(AUTHOR)
    expect(created.channel).toBe('Carta · Carta nº 219/2026')
    expect(created.subject.document).toBe('CPF ***.902.###-10')
    expect(created.timeline[0]).toMatchObject({
      title: 'Requisição registrada em nome do titular',
      author: AUTHOR,
    })
    expect(created.timeline[0]!.internal).toBeUndefined()
  })

  it('conta o prazo do dia do recebimento', async () => {
    const receipt = await registerOnBehalf(input({ receivedOn: daysAgo(3) }), AUTHOR)

    expect(daysUntil(receipt.dueAt)).toBe(LEGAL_DEADLINE_DAYS - 3)
  })

  it('conta as 24 horas do recebimento: chegou anteontem, já está vencido', async () => {
    const receipt = await registerOnBehalf(
      input({ rightNumeral: 'I', receivedOn: daysAgo(2) }),
      AUTHOR,
    )

    expect(receipt.immediate).toBe(true)
    expect(deadlineStatusOf(await fetchRequest(receipt.id))).toBe('vencida')
  })

  it('deixa uma carta antiga entrar na fila já vencida', async () => {
    const receipt = await registerOnBehalf(input({ receivedOn: daysAgo(20) }), AUTHOR)

    expect(deadlineStatusOf(await fetchRequest(receipt.id))).toBe('vencida')
  })

  it('recusa recebimento em data futura', async () => {
    await expect(registerOnBehalf(input({ receivedOn: daysAgo(-1) }), AUTHOR)).rejects.toThrow(
      new OnBehalfRuleError('data-futura'),
    )
  })

  it('recusa sem canal de origem ou sem verificação de identidade', async () => {
    await expect(registerOnBehalf(input({ channel: null }), AUTHOR)).rejects.toThrow(
      new OnBehalfRuleError('sem-canal'),
    )
    await expect(registerOnBehalf(input({ identityVerified: false }), AUTHOR)).rejects.toThrow(
      new OnBehalfRuleError('identidade-nao-verificada'),
    )
  })

  it('recusa titular sem nome ou com CPF incompleto', async () => {
    const subject = { ...input().subject, cpf: '318.902' }
    await expect(registerOnBehalf(input({ subject }), AUTHOR)).rejects.toThrow(
      new OnBehalfRuleError('titular-incompleto'),
    )
  })

  it('avisa o titular que tem conta, e só ele', async () => {
    const email = 'titular@exemplo.com.br'
    const { notifications } = useNotifications({ role: 'titular', email })
    const before = notifications.value.length

    await registerOnBehalf(input(), AUTHOR)
    expect(notifications.value).toHaveLength(before)

    const receipt = await registerOnBehalf(
      input({
        subject: {
          name: 'Marina Torres de Almeida',
          cpf: '476.201.789-04',
          email,
          hasAccount: true,
        },
      }),
      AUTHOR,
    )
    expect(notifications.value).toHaveLength(before + 1)
    expect(notifications.value[0]!.title).toBe(
      `A encarregada registrou a ${receipt.protocol} a seu pedido`,
    )
  })
})
