/**
 * Respostas da API para os testes de ponta a ponta, no formato dos DTOs do
 * backend. As datas são relativas a agora: um prazo "vencido há dois dias"
 * continua vencido há dois dias em qualquer dia em que a suíte rodar.
 */

export const DAY = 86_400_000
export const HOUR = 3_600_000

export const fromNow = (ms: number) => new Date(Date.now() + ms).toISOString()

export const ORG_ID = '01920000-0000-7000-8000-00000000a001'

export const ORGANIZATION = {
  slug: 'demonstracao',
  name: 'Instituto Meridiano de Saúde',
  dpo: {
    name: 'Helena Prado Vasconcelos',
    email: 'dpo@meridianosaude.org.br',
    phone: '(16) 3711-0480',
  },
  rightsGuidance: 'Envie seu pedido pelo portal: um direito por requisição.',
}

/** A conta como `GET /me` a devolve. */
export interface AccountFixture {
  id: string
  fullName: string
  email: string
  emailVerified: boolean
  passwordSet: boolean
  createdAt: string
  document: { type: string; masked: string; verified: boolean } | null
  phone: { masked: string } | null
  pendingEmailChange: { newEmail: string; expiresAt: string } | null
  memberships: { organizationId: string; organizationName: string; role: string }[]
}

const account = (
  overrides: Pick<AccountFixture, 'id' | 'fullName' | 'email'> & Partial<AccountFixture>,
): AccountFixture => ({
  passwordSet: true,
  createdAt: '2026-01-10T12:00:00.000Z',
  document: { type: 'CPF', masked: '•••.•••.789-••', verified: true },
  phone: { masked: '(••) •••••-3071' },
  pendingEmailChange: null,
  emailVerified: true,
  memberships: [],
  ...overrides,
})

export const TITULAR = account({
  id: '01920000-0000-7000-8000-00000000b001',
  fullName: 'Marina Torres de Almeida',
  email: 'titular@exemplo.com.br',
})

export const ENCARREGADO = account({
  id: '01920000-0000-7000-8000-00000000b002',
  fullName: 'Helena Prado Vasconcelos',
  email: 'helena.vasconcelos@meridianosaude.org.br',
  document: null,
  phone: { masked: '(••) ••••-4410' },
  memberships: [
    { organizationId: ORG_ID, organizationName: 'Instituto Meridiano de Saúde', role: 'DPO' },
  ],
})

export const organizationRef = { id: ORG_ID, name: ORGANIZATION.name, slug: ORGANIZATION.slug }

type Json = Record<string, unknown>

export function summary(overrides: Json = {}): Json {
  return {
    id: '01920000-0000-7000-8000-000000000447',
    protocolNumber: '2026-000447',
    organization: organizationRef,
    dataSubject: { id: TITULAR.id, fullName: TITULAR.fullName },
    rights: ['CONSENTED_DATA_DELETION'],
    status: 'OPEN',
    registeredAt: fromNow(-6 * DAY),
    dueAt: fromNow(9 * DAY),
    closedAt: null,
    deadlineStatus: 'ON_TIME',
    ...overrides,
  }
}

export function details(overrides: Json = {}): Json {
  return {
    id: '01920000-0000-7000-8000-000000000447',
    protocolNumber: '2026-000447',
    organization: organizationRef,
    dataSubject: null,
    registeredOnBehalf: false,
    rights: ['CONSENTED_DATA_DELETION'],
    responseFormat: 'COMPLETE',
    description:
      'Solicito a eliminação dos meus dados de contato usados em campanhas de comunicação da rede.',
    channel: 'PLATFORM',
    channelDetails: null,
    status: 'OPEN',
    registeredAt: fromNow(-6 * DAY),
    dueAt: fromNow(9 * DAY),
    deadlineStatus: 'ON_TIME',
    remainingSeconds: 9 * 86_400,
    closedAt: null,
    cancellationReason: null,
    attachments: [],
    viewerRoles: ['DATA_SUBJECT'],
    ...overrides,
  }
}

export function message(overrides: Json = {}): Json {
  return {
    id: '01920000-0000-7000-8000-0000000c0001',
    body: 'Pode confirmar se os lembretes de consulta também devem parar?',
    author: { id: ENCARREGADO.id, fullName: ENCARREGADO.fullName, role: 'DPO' },
    mine: false,
    isConclusive: false,
    edited: false,
    editedAt: null,
    editableUntil: null,
    createdAt: fromNow(-2 * DAY),
    attachments: [],
    ...overrides,
  }
}

export function page(items: unknown[]): Json {
  return { items, page: 1, pageSize: 50, total: items.length }
}

export function problem(status: number, detail: string) {
  return {
    statusCode: status,
    headers: { 'content-type': 'application/problem+json' },
    body: { status, detail },
  }
}

/** As requisições do titular de demonstração, uma por situação da lista. */
export function titularSummaries(): Json[] {
  return [
    summary({
      id: '01920000-0000-7000-8000-000000000418',
      protocolNumber: '2026-000418',
      rights: ['ANONYMIZATION_BLOCKING_OR_DELETION'],
      registeredAt: fromNow(-17 * DAY),
      dueAt: fromNow(-2 * DAY),
      deadlineStatus: 'OVERDUE',
    }),
    summary({
      id: '01920000-0000-7000-8000-000000000444',
      protocolNumber: '2026-000444',
      rights: ['DATA_CORRECTION'],
      registeredAt: fromNow(-12 * DAY),
      dueAt: fromNow(3 * DAY),
      deadlineStatus: 'DUE_SOON',
    }),
    summary(),
    summary({
      id: '01920000-0000-7000-8000-000000000392',
      protocolNumber: '2026-000392',
      rights: ['DATA_PORTABILITY'],
      status: 'COMPLETED',
      registeredAt: fromNow(-40 * DAY),
      dueAt: fromNow(-25 * DAY),
      closedAt: fromNow(-28 * DAY),
      deadlineStatus: 'CLOSED',
    }),
    summary({
      id: '01920000-0000-7000-8000-000000000377',
      protocolNumber: '2026-000377',
      rights: ['CONSENT_REVOCATION'],
      status: 'CANCELLED',
      registeredAt: fromNow(-60 * DAY),
      dueAt: fromNow(-45 * DAY),
      closedAt: fromNow(-58 * DAY),
      deadlineStatus: 'CLOSED',
    }),
  ]
}

/** A fila da organização: as cinco do titular de demonstração e mais três. */
export function queueSummaries(): Json[] {
  return [
    ...titularSummaries(),
    summary({
      id: '01920000-0000-7000-8000-000000000403',
      protocolNumber: '2026-000403',
      dataSubject: { id: 'titular-otavio', fullName: 'Otávio Lins Barreto' },
      rights: ['DATA_ACCESS'],
      registeredAt: fromNow(-16 * DAY),
      dueAt: fromNow(-1 * DAY),
      deadlineStatus: 'OVERDUE',
    }),
    summary({
      id: '01920000-0000-7000-8000-000000000431',
      protocolNumber: '2026-000431',
      dataSubject: { id: 'titular-rodrigo', fullName: 'Rodrigo Amaral Neves' },
      rights: ['DATA_CORRECTION'],
      registeredAt: fromNow(-5 * DAY),
      dueAt: fromNow(10 * DAY),
    }),
    summary({
      id: '01920000-0000-7000-8000-000000000452',
      protocolNumber: '2026-000452',
      dataSubject: { id: 'titular-iara', fullName: 'Iara Monteiro Salles' },
      rights: ['SHARING_DISCLOSURE'],
      registeredAt: fromNow(-1 * DAY),
      dueAt: fromNow(14 * DAY),
    }),
  ]
}
