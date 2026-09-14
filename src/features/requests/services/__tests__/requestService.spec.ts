import { describe, it, expect, beforeEach } from 'vitest'

import {
  RequestNotFoundError,
  answerRequest,
  cancelRequests,
  createRequest,
  deleteMessage,
  editMessage,
  fetchRequest,
  listMyRequests,
  listOrganizationRequests,
  registerOnBehalf,
  sendMessage,
} from '../requestService'
import { startSession } from '@/features/auth/composables/useSession'
import { mockApi, problem, route } from '@/test/api'
import { apiDetails, apiMessage, apiSummary, isoFromNow } from '@/test/factories'

const HOUR = 3_600_000

const registered = (hours: number) => ({
  id: '01920000-0000-7000-8000-000000000200',
  protocolNumber: '2026-000200',
  rights: ['DATA_ACCESS'],
  responseFormat: 'SIMPLIFIED',
  status: 'OPEN',
  registeredAt: isoFromNow(0),
  dueAt: isoFromNow(hours * HOUR),
  deadlineStatus: 'DUE_SOON',
  attachments: [],
})

beforeEach(() => {
  startSession({
    id: 'conta-dpo',
    name: 'Helena Prado Vasconcelos',
    email: 'helena@meridiano.org.br',
    role: 'encarregado',
    emailConfirmed: true,
    organizationId: 'org-1',
    organizationName: 'Instituto Meridiano de Saúde',
  })
})

describe('requestService · listas', () => {
  it('busca todas as páginas da própria lista e traduz cada linha', async () => {
    const { calls } = mockApi([
      route('GET', '/me/requests', (call) =>
        call.query.get('page') === '1'
          ? { items: [apiSummary()], page: 1, pageSize: 1, total: 2 }
          : {
              items: [apiSummary({ id: 'outra', protocolNumber: '2026-000102', status: 'COMPLETED' })],
              page: 2,
              pageSize: 1,
              total: 2,
            },
      ),
    ])

    const requests = await listMyRequests()

    expect(requests.map((request) => request.protocol)).toEqual(['2026-000101', '2026-000102'])
    expect(requests[0]).toMatchObject({ rightNumeral: 'VI', status: 'aberta', deadline: 'em-dia' })
    expect(requests[1]!.status).toBe('concluida')
    expect(calls).toHaveLength(2)
  })

  it('pede a fila da organização vinculada à sessão', async () => {
    const { calls } = mockApi([
      route('GET', '/organizations/org-1/requests', { items: [], page: 1, pageSize: 50, total: 0 }),
    ])

    await expect(listOrganizationRequests()).resolves.toEqual([])
    expect(calls[0]!.path).toBe('/organizations/org-1/requests')
  })
})

describe('requestService · detalhe', () => {
  it('junta detalhe, conversa e pesquisa numa requisição só', async () => {
    mockApi([
      route('GET', '/requests/r1', apiDetails({ id: 'r1', status: 'COMPLETED', closedAt: isoFromNow(0) })),
      route('GET', '/requests/r1/messages', {
        items: [
          apiMessage(),
          apiMessage({
            id: 'parecer',
            isConclusive: true,
            mine: false,
            body: 'Seus dados foram eliminados.',
            author: { id: 'dpo', fullName: 'Helena Prado Vasconcelos', role: 'DPO' },
          }),
        ],
      }),
      route('GET', '/requests/r1/survey', {
        available: true,
        answered: true,
        response: { rating: 5, comment: null, respondedAt: isoFromNow(0) },
      }),
    ])

    const request = await fetchRequest('r1')

    expect(request.messages.map((message) => message.kind)).toEqual(['mensagem', 'parecer'])
    expect(request.answer).toMatchObject({ text: 'Seus dados foram eliminados.' })
    expect(request.survey?.rating).toBe(5)
    expect(request.timeline[0]!.highlight).toBe(true)
  })

  it('trata pedido alheio como inexistente', async () => {
    mockApi([route('GET', '/requests/r9', problem(403, 'Acesso negado'))])

    await expect(fetchRequest('r9')).rejects.toBeInstanceOf(RequestNotFoundError)
  })
})

describe('requestService · registro', () => {
  it('registra pelo portal com o direito, o formato e os anexos', async () => {
    const { calls } = mockApi([route('POST', '/portal/demonstracao/requests', registered(24))])
    const file = new File(['x'], 'rg.pdf', { type: 'application/pdf' })

    const receipt = await createRequest({
      rightNumeral: 'II',
      accessFormat: 'simplificado',
      description: 'Quero ver os meus dados cadastrais.',
      attachments: [{ name: 'rg.pdf', meta: '1 KB', file }],
    })

    // A primeira chamada pode ser o perfil da organização, pedido uma vez só.
    const post = calls.find((call) => call.method === 'POST')!
    expect(post.body).toEqual({
      fields: {
        rights: ['DATA_ACCESS'],
        responseFormat: ['SIMPLIFIED'],
        description: ['Quero ver os meus dados cadastrais.'],
      },
      files: ['rg.pdf'],
    })
    expect(receipt).toMatchObject({ protocol: '2026-000200', immediate: true })
  })

  it('pede o formato simplificado para a confirmação de tratamento', async () => {
    const { calls } = mockApi([route('POST', '/portal/demonstracao/requests', registered(24))])

    await createRequest({ rightNumeral: 'I', description: 'Vocês tratam meus dados?', attachments: [] })

    const post = calls.find((call) => call.method === 'POST')!
    expect((post.body as { fields: Record<string, string[]> }).fields.responseFormat).toEqual([
      'SIMPLIFIED',
    ])
  })

  it('registra em nome do titular com o e-mail da conta e o canal', async () => {
    const { calls } = mockApi([route('POST', '/organizations/org-1/requests', registered(360))])

    const receipt = await registerOnBehalf({
      subjectEmail: ' Titular@Exemplo.com.br ',
      identityVerified: true,
      channel: 'PHONE',
      reference: 'atendimento 4471',
      rightNumeral: 'VI',
      description: 'Pediu por telefone a eliminação dos dados de contato.',
      attachments: [],
    })

    expect((calls[0]!.body as { fields: Record<string, string[]> }).fields).toMatchObject({
      dataSubjectEmail: ['titular@exemplo.com.br'],
      channel: ['PHONE'],
      channelDetails: ['atendimento 4471'],
      rights: ['CONSENTED_DATA_DELETION'],
    })
    expect(receipt).toMatchObject({ immediate: false, origin: { channel: 'PHONE' } })
  })

  it('repassa a recusa do servidor quando o titular não tem conta', async () => {
    mockApi([
      route(
        'POST',
        '/organizations/org-1/requests',
        problem(422, 'Não há conta ativa e com e-mail confirmado para este endereço.'),
      ),
    ])

    await expect(
      registerOnBehalf({
        subjectEmail: 'sem-conta@exemplo.com.br',
        identityVerified: true,
        channel: 'EMAIL',
        rightNumeral: 'III',
        description: 'Pedido recebido por e-mail para correção de endereço.',
        attachments: [],
      }),
    ).rejects.toMatchObject({ status: 422 })
  })
})

describe('requestService · conversa e encerramento', () => {
  it('envia, edita e exclui mensagens pelas rotas da requisição', async () => {
    const { calls } = mockApi([
      route('POST', '/requests/r1/messages', apiMessage({ body: 'Olá' })),
      route('PATCH', '/requests/r1/messages/m1', apiMessage({ body: 'Olá de novo', edited: true })),
      route('DELETE', '/requests/r1/messages/m1', { status: 204 }),
    ])

    const sent = await sendMessage('r1', { text: '  Olá  ' })
    const edited = await editMessage('r1', 'm1', 'Olá de novo')
    await deleteMessage('r1', 'm1')

    expect(sent.text).toBe('Olá')
    expect(edited.editedAt).toBeUndefined()
    expect(calls.map((call) => call.method)).toEqual(['POST', 'PATCH', 'DELETE'])
    expect(calls[1]!.body).toEqual({ body: 'Olá de novo' })
  })

  it('finaliza com o parecer e o resultado anexado', async () => {
    const { calls } = mockApi([route('POST', '/requests/r1/complete', { id: 'r1' })])
    const file = new File(['x'], 'resultado.pdf', { type: 'application/pdf' })

    await answerRequest('r1', {
      text: 'Dados eliminados.',
      attachments: [{ name: 'resultado.pdf', meta: '', file }],
    })

    expect(calls[0]!.body).toEqual({ fields: { body: ['Dados eliminados.'] }, files: ['resultado.pdf'] })
  })

  it('cancela em lote e separa o que ficou de fora', async () => {
    const { calls } = mockApi([
      route('POST', '/me/requests/cancel', {
        cancelled: [
          {
            id: 'r1',
            protocolNumber: '2026-000101',
            status: 'CANCELLED',
            closedAt: isoFromNow(0),
            dueAt: isoFromNow(HOUR),
            onTime: true,
          },
        ],
        rejected: [{ id: 'r2', protocolNumber: '2026-000102', reason: 'NOT_OPEN' }],
      }),
    ])

    const result = await cancelRequests(['r1', 'r2'], '  Resolvi direto com a empresa.  ')

    expect(calls[0]!.body).toEqual({ ids: ['r1', 'r2'], reason: 'Resolvi direto com a empresa.' })
    expect(result.cancelled).toEqual([{ id: 'r1', protocol: '2026-000101' }])
    expect(result.skipped).toEqual([{ id: 'r2', protocol: '2026-000102', reason: 'NOT_OPEN' }])
  })
})
