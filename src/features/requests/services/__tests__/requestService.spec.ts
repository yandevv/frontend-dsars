import { describe, it, expect, vi } from 'vitest'

import { DEMO_REQUESTS } from '@/features/requests/data/requests'
import { LEGAL_DEADLINE_DAYS } from '@/features/requests/constants/requestPolicy'
import {
  RequestNotFoundError,
  answerRequest,
  askForComplement,
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
})
