import { describe, it, expect, vi } from 'vitest'

import { DEMO_REQUESTS } from '@/features/requests/data/requests'
import { LEGAL_DEADLINE_DAYS } from '@/features/requests/constants/requestPolicy'
import {
  RequestNotFoundError,
  answerRequest,
  askForComplement,
  cancelRequests,
  createRequest,
  fetchRequest,
  listRequests,
} from '../requestService'
import { daysUntil } from '@/shared/utils/date'
import { isUuidV7 } from '@/shared/utils/uuid'

// A espera artificial existe para a tela mostrar o estado de envio; nos testes
// só atrasaria a suíte.
vi.mock('@/features/auth/services/fakeNetwork', () => ({ delay: () => Promise.resolve() }))

function idOf(protocol: string): string {
  return DEMO_REQUESTS.find((request) => request.protocol === protocol)!.id
}

const subject = { name: 'Marina Torres de Almeida', email: 'titular@exemplo.com.br' }

describe('requestService', () => {
  it('registra a requisição com protocolo, identificador e prazo do art. 19', async () => {
    const receipt = await createRequest(
      { rightNumeral: 'VI', description: 'Peço a eliminação dos meus dados de contato.', attachments: [] },
      subject,
    )

    expect(receipt.protocol).toMatch(/^2026-000\d{3}$/)
    expect(isUuidV7(receipt.id)).toBe(true)
    expect(daysUntil(receipt.dueAt)).toBe(LEGAL_DEADLINE_DAYS)
  })

  it('coloca a requisição recém-criada na fila da organização', async () => {
    const receipt = await createRequest(
      { rightNumeral: 'II', description: 'Quero cópia dos meus exames.', attachments: [] },
      subject,
    )

    const queue = await listRequests()
    expect(queue.map((item) => item.protocol)).toContain(receipt.protocol)

    const created = await fetchRequest(receipt.id)
    expect(created.status).toBe('em-analise')
    expect(created.timeline).toHaveLength(1)
  })

  it('recusa um identificador que não existe', async () => {
    await expect(fetchRequest('01a00000-0000-7000-8000-000000000000')).rejects.toBeInstanceOf(
      RequestNotFoundError,
    )
  })

  it('não aceita mais o protocolo no lugar do identificador', async () => {
    await expect(fetchRequest('2026-000418')).rejects.toBeInstanceOf(RequestNotFoundError)
  })

  it('encerra o atendimento e registra a resposta na trilha', async () => {
    const answered = await answerRequest(idOf('2026-000447'), {
      outcome: 'atendido',
      text: 'Segue a declaração completa dos dados que mantemos sobre você.',
      author: 'Helena Prado Vasconcelos',
    })

    expect(answered.status).toBe('concluida')
    expect(answered.answer?.outcome).toBe('atendido')
    expect(answered.timeline[0]?.title).toContain('Atendimento finalizado')
    expect(answered.timeline[0]?.highlight).toBe(true)
  })

  it('pede complemento sem tirar a requisição da fila', async () => {
    const waiting = await askForComplement(idOf('2026-000444'), {
      detail: 'Precisamos de uma cópia do documento de identidade.',
    })

    expect(waiting.status).toBe('aguardando-complemento')
    expect(waiting.closedAt).toBeUndefined()
  })

  it('cancela em lote com um motivo único e registra na trilha de cada uma', async () => {
    const ids = [idOf('2026-000418'), idOf('2026-000403')]
    const { cancelled, skipped } = await cancelRequests(ids, '  Consegui os documentos direto na unidade.  ')

    expect(skipped).toEqual([])
    expect(cancelled.map((request) => request.status)).toEqual(['cancelada', 'cancelada'])
    for (const request of cancelled) {
      expect(request.closedAt).toBeDefined()
      expect(request.timeline[0]?.title).toBe('Requisição cancelada pelo titular')
      expect(request.timeline[0]?.detail).toContain('“Consegui os documentos direto na unidade.”')
    }
  })

  it('deixa de fora o que já estava encerrado, sem falhar o lote', async () => {
    const { cancelled, skipped } = await cancelRequests(
      [idOf('2026-000392'), idOf('2026-000452')],
      'Não preciso mais destes pedidos.',
    )

    expect(skipped.map((request) => request.protocol)).toEqual(['2026-000392'])
    expect(cancelled.map((request) => request.protocol)).toEqual(['2026-000452'])
    expect(skipped[0]?.status).toBe('concluida')
  })

  it('recusa um motivo curto demais', async () => {
    await expect(cancelRequests([idOf('2026-000431')], 'não quero')).rejects.toThrow(
      'O motivo precisa de pelo menos 10 caracteres.',
    )
  })
})
