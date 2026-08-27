import { describe, it, expect, vi } from 'vitest'

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

// A espera artificial existe para a tela mostrar o estado de envio; nos testes
// só atrasaria a suíte.
vi.mock('@/features/auth/services/fakeNetwork', () => ({ delay: () => Promise.resolve() }))

const subject = { name: 'Marina Torres de Almeida', email: 'titular@exemplo.com.br' }

describe('requestService', () => {
  it('registra a requisição com protocolo, identificador e prazo do art. 19', async () => {
    const receipt = await createRequest(
      { rightNumeral: 'VI', description: 'Peço a eliminação dos meus dados de contato.', attachments: [] },
      subject,
    )

    expect(receipt.protocol).toMatch(/^2026-000\d{3}$/)
    expect(receipt.id).toContain('req_')
    expect(daysUntil(receipt.dueAt)).toBe(LEGAL_DEADLINE_DAYS)
  })

  it('coloca a requisição recém-criada na fila da organização', async () => {
    const receipt = await createRequest(
      { rightNumeral: 'II', description: 'Quero cópia dos meus exames.', attachments: [] },
      subject,
    )

    const queue = await listRequests()
    expect(queue.map((item) => item.protocol)).toContain(receipt.protocol)

    const created = await fetchRequest(receipt.protocol)
    expect(created.status).toBe('em-analise')
    expect(created.timeline).toHaveLength(1)
  })

  it('recusa um protocolo que não existe', async () => {
    await expect(fetchRequest('2026-999999')).rejects.toBeInstanceOf(RequestNotFoundError)
  })

  it('encerra o atendimento e registra a resposta na trilha', async () => {
    const answered = await answerRequest('2026-000447', {
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
    const waiting = await askForComplement('2026-000444', {
      detail: 'Precisamos de uma cópia do documento de identidade.',
    })

    expect(waiting.status).toBe('aguardando-complemento')
    expect(waiting.closedAt).toBeUndefined()
  })
})
