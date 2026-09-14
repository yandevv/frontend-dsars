/**
 * Servidores em memória para os avisos e as preferências de notificação: o
 * que a tela muda, a próxima leitura devolve.
 */
import { HOUR, fromNow, page, problem } from './fixtures'
import { REQUEST_IDS } from './requestServer'

type Json = Record<string, unknown>

function notification(
  id: string,
  title: string,
  read: boolean,
  hoursAgo: number,
  eventType: string,
  resourceId: string,
): Json {
  return {
    id,
    eventType,
    title,
    body: 'Abra a requisição para ver os detalhes.',
    resourceType: 'Request',
    resourceId,
    read,
    readAt: read ? fromNow(-hoursAgo * HOUR) : null,
    createdAt: fromNow(-hoursAgo * HOUR),
  }
}

/** Seis avisos, dois não lidos; o de 2026-000301 leva a um recurso que sumiu. */
export function serveInbox() {
  let items: Json[] = [
    notification('n1', 'O prazo de resposta da 2026-000418 venceu', false, 1, 'REQUEST_DEADLINE_EXPIRED', REQUEST_IDS.eliminacao),
    notification('n2', 'A equipe escreveu na requisição 2026-000447', false, 3, 'REQUEST_MESSAGE_RECEIVED', REQUEST_IDS.andamento),
    notification('n3', 'Cancelamento do 2026-000301 confirmado', true, 30, 'REQUEST_CANCELLED', 'sumiu'),
    notification('n4', 'A resposta à 2026-000392 está disponível', true, 60, 'REQUEST_COMPLETED', REQUEST_IDS.portabilidade),
    notification('n5', 'Como foi o atendimento da 2026-000392?', true, 61, 'SATISFACTION_SURVEY_AVAILABLE', REQUEST_IDS.portabilidade),
    notification('n6', 'Sua senha foi alterada', true, 200, 'ACCOUNT_SECURITY_ALERT', 'conta'),
  ]
  const unread = () => items.filter((item) => !item.read).length
  const markRead = (id: string) => {
    items = items.map((item) => (item.id === id ? { ...item, read: true } : item))
  }

  cy.intercept('GET', '/api/me/notifications?*', (request) =>
    request.reply({ body: { ...page(items), pageSize: 20 } }),
  )
  cy.intercept('GET', '/api/me/notifications/unread-count', (request) =>
    request.reply({ body: { unreadCount: unread() } }),
  )
  cy.intercept('PATCH', '/api/me/notifications/*/read', (request) => {
    markRead(request.url.split('/notifications/')[1]!.split('/')[0]!)
    request.reply({ body: { unreadCount: unread() } })
  })
  cy.intercept('POST', '/api/me/notifications/read-all', (request) => {
    items = items.map((item) => ({ ...item, read: true }))
    request.reply({ body: { unreadCount: 0 } })
  }).as('readAll')
  cy.intercept('DELETE', '/api/me/notifications', (request) => {
    items = []
    request.reply({ body: { cleared: 6, unreadCount: 0 } })
  }).as('clear')
  cy.intercept('POST', '/api/me/notifications/*/open', (request) => {
    const id = request.url.split('/notifications/')[1]!.split('/')[0]!
    markRead(id)
    const target = items.find((item) => item.id === id)!
    if (target.resourceId === 'sumiu') {
      request.reply(problem(410, 'Este recurso não está mais disponível.'))
      return
    }
    request.reply({
      body: { resourceType: target.resourceType, resourceId: target.resourceId, path: null },
    })
  })
}

/** O catálogo de eventos do titular, com os canais obrigatórios marcados. */
export function servePreferences() {
  let events: Json[] = [
    {
      eventType: 'REQUEST_COMPLETED',
      label: 'Requisição finalizada',
      description: 'Quando o encarregado conclui o atendimento.',
      channels: [
        { channel: 'IN_APP', enabled: true, mandatory: true },
        { channel: 'EMAIL', enabled: true, mandatory: true },
      ],
    },
    {
      eventType: 'REQUEST_MESSAGE_RECEIVED',
      label: 'Nova mensagem na requisição',
      description: 'Quando a outra parte envia uma mensagem na requisição.',
      channels: [
        { channel: 'IN_APP', enabled: true, mandatory: true },
        { channel: 'EMAIL', enabled: true, mandatory: false },
      ],
    },
    {
      eventType: 'SATISFACTION_SURVEY_AVAILABLE',
      label: 'Pesquisa de satisfação disponível',
      description: 'Quando a pesquisa é liberada após a finalização.',
      channels: [
        { channel: 'IN_APP', enabled: true, mandatory: false },
        { channel: 'EMAIL', enabled: false, mandatory: false },
      ],
    },
    {
      eventType: 'ACCOUNT_SECURITY_ALERT',
      label: 'Segurança da conta',
      description: 'Troca de senha, novo acesso e demais eventos de segurança da conta.',
      channels: [
        { channel: 'IN_APP', enabled: true, mandatory: true },
        { channel: 'EMAIL', enabled: true, mandatory: true },
      ],
    },
  ]

  cy.intercept('GET', '/api/me/notification-preferences', (request) =>
    request.reply({ body: { events } }),
  )
  cy.intercept('PUT', '/api/me/notification-preferences', (request) => {
    const { preferences } = request.body as {
      preferences: { eventType: string; channel: string; enabled: boolean }[]
    }
    events = events.map((event) => ({
      ...event,
      channels: (event.channels as Json[]).map((channel) => {
        const change = preferences.find(
          (item) => item.eventType === event.eventType && item.channel === channel.channel,
        )
        return change ? { ...channel, enabled: change.enabled } : channel
      }),
    }))
    request.reply({ body: { events } })
  }).as('savePreferences')
}

/** A conta do titular de demonstração: dados mascarados, revelação e alterações. */
export function serveAccount(initial: object) {
  let account: Json = { ...initial }

  cy.intercept('GET', '/api/me', (request) => request.reply({ body: account })).as('me')
  cy.intercept('PATCH', '/api/me', (request) => {
    const body = request.body as { fullName?: string; phone?: string }
    if (body.phone) {
      const digits = body.phone.replace(/\D/g, '')
      if (digits.length < 10) {
        request.reply(problem(400, 'Informe o DDD e o número do telefone.'))
        return
      }
      account = { ...account, phone: { masked: `(••) •••••-${digits.slice(-4)}` } }
    }
    if (body.fullName) account = { ...account, fullName: body.fullName }
    request.reply({ body: account })
  }).as('updateProfile')
  cy.intercept('POST', '/api/me/personal-data/reveal', {
    body: { document: { type: 'CPF', value: '476.201.789-04' }, phone: '(16) 99482-3071' },
  }).as('reveal')
  cy.intercept('POST', '/api/me/email-change', (request) => {
    const { newEmail } = request.body as { newEmail: string }
    account = { ...account, pendingEmailChange: { newEmail, expiresAt: fromNow(24 * HOUR) } }
    request.reply({ statusCode: 202, body: {} })
  }).as('emailChange')
}

const AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile Safari/604.1',
  'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0',
  'Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/140.0 Mobile Safari/537.36',
]

/** Quatro sessões, a primeira a atual; trocar a senha ou encerrar as outras deixa só ela. */
export function serveSecurity() {
  let sessions: Json[] = AGENTS.map((userAgent, index) => ({
    id: `01920000-0000-7000-8000-0000000e000${index}`,
    familyId: `familia-${index}`,
    ipAddress: `177.44.12.${index + 10}`,
    userAgent,
    createdAt: fromNow(-(index * 24 + 1) * HOUR),
    lastUsedAt: fromNow(-index * 24 * HOUR),
    expiresAt: fromNow(24 * HOUR),
    current: index === 0,
  }))
  const onlyCurrent = () => {
    const revoked = sessions.length - 1
    sessions = sessions.filter((session) => session.current)
    return revoked
  }

  cy.intercept('GET', '/api/me/security', (request) =>
    request.reply({
      body: { passwordSet: true, passwordChangedAt: '2026-06-02T12:00:00.000Z', sessions },
    }),
  )
  cy.intercept('PUT', '/api/me/password', (request) => {
    const { currentPassword } = request.body as { currentPassword?: string }
    if (currentPassword !== 'SenhaSegura!123') {
      request.reply(problem(400, 'A senha atual não confere.'))
      return
    }
    request.reply({ body: { revokedSessions: onlyCurrent() } })
  }).as('password')
  cy.intercept('DELETE', '/api/me/sessions/*', (request) => {
    const id = request.url.split('/sessions/')[1]
    sessions = sessions.filter((session) => session.id !== id)
    request.reply({ statusCode: 204 })
  }).as('endSession')
  cy.intercept('DELETE', '/api/me/sessions', (request) =>
    request.reply({ body: { revokedSessions: onlyCurrent() } }),
  ).as('endOthers')
}
