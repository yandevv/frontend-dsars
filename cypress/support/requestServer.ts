/**
 * Um backend de requisições em memória, para os testes das telas de detalhe.
 *
 * Responde como a API: detalhe, conversa, pesquisa, finalização e
 * cancelamento, guardando o que mudou para a próxima leitura — a tela relê a
 * requisição depois de cada ação, e precisa ver o efeito.
 */
import {
  DAY,
  ENCARREGADO,
  TITULAR,
  details,
  fromNow,
  message,
  page,
  problem,
  summary,
} from './fixtures'

type Json = Record<string, unknown>
type Viewer = 'titular' | 'encarregado'

interface Stored {
  details: Json
  messages: Json[]
  survey: Json | null
}

let sequence = 0
const nextId = () => `01920000-0000-7000-8000-0000000d${String(++sequence).padStart(4, '0')}`

export const REQUEST_IDS = {
  eliminacao: '01920000-0000-7000-8000-000000000418',
  portabilidade: '01920000-0000-7000-8000-000000000392',
  andamento: '01920000-0000-7000-8000-000000000447',
}

function seed(viewer: Viewer): Map<string, Stored> {
  const subject = { id: TITULAR.id, fullName: TITULAR.fullName, email: TITULAR.email }
  const common = {
    viewerRoles: viewer === 'titular' ? ['DATA_SUBJECT'] : ['DPO'],
    dataSubject: viewer === 'titular' ? null : subject,
  }
  const team = { id: ENCARREGADO.id, fullName: ENCARREGADO.fullName, role: 'DPO' }

  return new Map<string, Stored>([
    [
      REQUEST_IDS.eliminacao,
      {
        details: details({
          ...common,
          id: REQUEST_IDS.eliminacao,
          protocolNumber: '2026-000418',
          rights: ['ANONYMIZATION_BLOCKING_OR_DELETION'],
          registeredAt: fromNow(-17 * DAY),
          dueAt: fromNow(-2 * DAY),
          deadlineStatus: 'OVERDUE',
          attachments: [
            {
              id: 'anexo-rg',
              kind: 'REQUEST_DOCUMENT',
              fileName: 'documento-identidade.pdf',
              contentType: 'application/pdf',
              sizeBytes: 480_000,
              createdAt: fromNow(-17 * DAY),
            },
          ],
        }),
        messages: [
          message({
            id: 'msg-equipe',
            body: 'Já localizamos seus dados de contato nas bases de campanha.',
            author: team,
            mine: viewer === 'encarregado',
            createdAt: fromNow(-3 * DAY),
          }),
        ],
        survey: null,
      },
    ],
    [
      REQUEST_IDS.portabilidade,
      {
        details: details({
          ...common,
          id: REQUEST_IDS.portabilidade,
          protocolNumber: '2026-000392',
          rights: ['DATA_PORTABILITY'],
          status: 'COMPLETED',
          registeredAt: fromNow(-40 * DAY),
          dueAt: fromNow(-25 * DAY),
          closedAt: fromNow(-28 * DAY),
          deadlineStatus: 'CLOSED',
          remainingSeconds: null,
        }),
        messages: [
          message({
            id: 'msg-parecer',
            isConclusive: true,
            body: 'Seguem seus dados em formato estruturado, prontos para levar a outro serviço.',
            author: team,
            mine: viewer === 'encarregado',
            createdAt: fromNow(-28 * DAY),
            attachments: [
              {
                id: 'anexo-resultado',
                kind: 'OUTCOME_DOCUMENT',
                fileName: 'portabilidade.pdf',
                contentType: 'application/pdf',
                sizeBytes: 120_000,
                createdAt: fromNow(-28 * DAY),
              },
            ],
          }),
        ],
        survey: null,
      },
    ],
    [
      REQUEST_IDS.andamento,
      { details: details({ ...common }), messages: [], survey: null },
    ],
  ])
}

/** Liga o servidor e devolve o armazenamento, para o teste conferir o que chegou. */
export function serveRequests(viewer: Viewer) {
  const store = seed(viewer)
  const author =
    viewer === 'titular'
      ? { id: TITULAR.id, fullName: TITULAR.fullName, role: 'DATA_SUBJECT' }
      : { id: ENCARREGADO.id, fullName: ENCARREGADO.fullName, role: 'DPO' }

  const find = (url: string) => store.get(url.split('/api/requests/')[1]!.split(/[/?]/)[0]!)

  // As listas mostram o que o armazenamento tem, no formato resumido.
  const summaries = () =>
    [...store.values()].map(({ details: item }) =>
      summary({
        id: item.id,
        protocolNumber: item.protocolNumber,
        rights: item.rights,
        status: item.status,
        registeredAt: item.registeredAt,
        dueAt: item.dueAt,
        closedAt: item.closedAt,
        deadlineStatus: item.deadlineStatus,
      }),
    )
  cy.intercept('GET', '/api/me/requests?*', (request) => request.reply({ body: page(summaries()) }))
  cy.intercept('GET', '/api/organizations/*/requests?*', (request) =>
    request.reply({ body: page(summaries()) }),
  )

  cy.intercept('GET', '/api/requests/*/messages', (request) => {
    const stored = find(request.url)
    request.reply(stored ? { body: { items: stored.messages } } : problem(404, 'Não encontrada.'))
  })

  cy.intercept('POST', '/api/requests/*/messages', (request) => {
    const stored = find(request.url)!
    const body = /name="body"\r\n\r\n([^\r]*)/.exec(String(request.body))?.[1] ?? null
    const created = message({
      id: nextId(),
      body,
      author,
      mine: true,
      editableUntil: fromNow(30 * 60_000),
      createdAt: fromNow(0),
    })
    stored.messages.push(created)
    request.reply({ statusCode: 201, body: created })
  }).as('sendMessage')

  cy.intercept('PATCH', '/api/requests/*/messages/*', (request) => {
    const stored = find(request.url)!
    const id = request.url.split('/messages/')[1]!
    const target = stored.messages.find((item) => item.id === id)!
    Object.assign(target, {
      body: (request.body as { body: string }).body,
      edited: true,
      editedAt: fromNow(0),
    })
    request.reply({ body: target })
  }).as('editMessage')

  cy.intercept('DELETE', '/api/requests/*/messages/*', (request) => {
    const stored = find(request.url)!
    const id = request.url.split('/messages/')[1]!
    stored.messages = stored.messages.filter((item) => item.id !== id)
    request.reply({ statusCode: 204 })
  }).as('deleteMessage')

  cy.intercept('POST', '/api/requests/*/complete', (request) => {
    const stored = find(request.url)!
    const body = /name="body"\r\n\r\n([^\r]*)/.exec(String(request.body))?.[1] ?? ''
    Object.assign(stored.details, {
      status: 'COMPLETED',
      closedAt: fromNow(0),
      deadlineStatus: 'CLOSED',
      remainingSeconds: null,
    })
    stored.messages.push(
      message({
        id: nextId(),
        isConclusive: true,
        body,
        author,
        mine: true,
        createdAt: fromNow(0),
        attachments: [
          {
            id: nextId(),
            kind: 'OUTCOME_DOCUMENT',
            fileName: 'resultado.pdf',
            contentType: 'application/pdf',
            sizeBytes: 1_000,
            createdAt: fromNow(0),
          },
        ],
      }),
    )
    request.reply({ body: { id: stored.details.id, status: 'COMPLETED' } })
  }).as('complete')

  cy.intercept('POST', '/api/me/requests/cancel', (request) => {
    const { ids, reason } = request.body as { ids: string[]; reason: string }
    const cancelled = ids.flatMap((id) => {
      const stored = store.get(id)
      if (!stored || stored.details.status !== 'OPEN') return []
      Object.assign(stored.details, {
        status: 'CANCELLED',
        closedAt: fromNow(0),
        cancellationReason: reason,
        deadlineStatus: 'CLOSED',
      })
      return [{ id, protocolNumber: stored.details.protocolNumber, status: 'CANCELLED' }]
    })
    request.reply({ body: { cancelled, rejected: [] } })
  }).as('cancel')

  cy.intercept('GET', '/api/requests/*/survey', (request) => {
    const stored = find(request.url)!
    request.reply({
      body: { available: true, answered: stored.survey !== null, response: stored.survey },
    })
  })

  cy.intercept('POST', '/api/requests/*/survey', (request) => {
    const stored = find(request.url)!
    const { rating, comment } = request.body as { rating: number; comment?: string }
    stored.survey = { rating, comment: comment ?? null, respondedAt: fromNow(0) }
    request.reply({ statusCode: 201, body: stored.survey })
  }).as('survey')

  cy.intercept('GET', '/api/requests/*/attachments/*/download', {
    body: { url: '/aviso-de-privacidade', expiresAt: fromNow(60_000), fileName: 'arquivo.pdf' },
  }).as('download')

  // Registrado por último: vale antes dos demais só para o detalhe em si.
  cy.intercept('GET', /\/api\/requests\/[^/]+$/, (request) => {
    const stored = find(request.url)
    request.reply(stored ? { body: stored.details } : problem(404, 'Não encontrada.'))
  })

  return store
}
