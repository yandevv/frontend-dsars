import type { ApiMessage, ApiRequestDetails, ApiRequestSummary } from '@/shared/api/contracts'
import type { DataRequest, RequestMessage } from '@/features/requests/types/request'

const DAY = 86_400_000

export function isoFromNow(ms: number): string {
  return new Date(Date.now() + ms).toISOString()
}

/** Uma requisição da interface, aberta e em dia, com o que o teste precisar trocar. */
export function makeRequest(overrides: Partial<DataRequest> = {}): DataRequest {
  return {
    protocol: '2026-000101',
    id: '01920000-0000-7000-8000-000000000101',
    rightNumeral: 'VI',
    description: 'Solicito a eliminação dos meus dados de contato usados em campanhas.',
    status: 'aberta',
    subject: { id: 'titular-1', name: 'Marina Torres de Almeida', email: 'marina@exemplo.com.br' },
    registeredAt: isoFromNow(-2 * DAY),
    dueAt: isoFromNow(13 * DAY),
    deadline: 'em-dia',
    channel: 'Portal do titular',
    attachments: [],
    timeline: [],
    messages: [],
    ...overrides,
  }
}

export function makeMessage(overrides: Partial<RequestMessage> = {}): RequestMessage {
  return {
    id: 'mensagem-1',
    kind: 'mensagem',
    author: 'Marina Torres de Almeida',
    authorRole: 'titular',
    text: 'Segue o documento pedido.',
    attachments: [],
    sentAt: isoFromNow(-60_000),
    mine: true,
    editableUntil: isoFromNow(29 * 60_000),
    ...overrides,
  }
}

export function apiSummary(overrides: Partial<ApiRequestSummary> = {}): ApiRequestSummary {
  return {
    id: '01920000-0000-7000-8000-000000000101',
    protocolNumber: '2026-000101',
    organization: { id: 'org-1', name: 'Instituto Meridiano de Saúde', slug: 'demonstracao' },
    dataSubject: { id: 'titular-1', fullName: 'Marina Torres de Almeida' },
    rights: ['CONSENTED_DATA_DELETION'],
    status: 'OPEN',
    registeredAt: isoFromNow(-2 * DAY),
    dueAt: isoFromNow(13 * DAY),
    closedAt: null,
    deadlineStatus: 'ON_TIME',
    ...overrides,
  }
}

export function apiDetails(overrides: Partial<ApiRequestDetails> = {}): ApiRequestDetails {
  return {
    id: '01920000-0000-7000-8000-000000000101',
    protocolNumber: '2026-000101',
    organization: { id: 'org-1', name: 'Instituto Meridiano de Saúde', slug: 'demonstracao' },
    dataSubject: null,
    registeredOnBehalf: false,
    rights: ['CONSENTED_DATA_DELETION'],
    responseFormat: 'COMPLETE',
    description: 'Solicito a eliminação dos meus dados de contato usados em campanhas.',
    channel: 'PLATFORM',
    channelDetails: null,
    status: 'OPEN',
    registeredAt: isoFromNow(-2 * DAY),
    dueAt: isoFromNow(13 * DAY),
    deadlineStatus: 'ON_TIME',
    remainingSeconds: 13 * 86_400,
    closedAt: null,
    cancellationReason: null,
    attachments: [],
    viewerRoles: ['DATA_SUBJECT'],
    ...overrides,
  }
}

export function apiMessage(overrides: Partial<ApiMessage> = {}): ApiMessage {
  return {
    id: 'mensagem-1',
    body: 'Segue o documento pedido.',
    author: { id: 'titular-1', fullName: 'Marina Torres de Almeida', role: 'DATA_SUBJECT' },
    mine: true,
    isConclusive: false,
    edited: false,
    editedAt: null,
    editableUntil: isoFromNow(29 * 60_000),
    createdAt: isoFromNow(-60_000),
    attachments: [],
    ...overrides,
  }
}

/**
 * As cinco requisições do titular de demonstração, uma por situação da lista:
 * vencida, a vencer em três dias, em dia, concluída e cancelada.
 */
export function titularRequests(): DataRequest[] {
  return [
    makeRequest({
      id: 'r418',
      protocol: '2026-000418',
      rightNumeral: 'IV',
      registeredAt: isoFromNow(-17 * DAY),
      dueAt: isoFromNow(-2 * DAY),
      deadline: 'vencida',
    }),
    makeRequest({
      id: 'r444',
      protocol: '2026-000444',
      rightNumeral: 'III',
      registeredAt: isoFromNow(-12 * DAY),
      dueAt: isoFromNow(3 * DAY),
      deadline: 'proxima',
    }),
    makeRequest({
      id: 'r447',
      protocol: '2026-000447',
      rightNumeral: 'VI',
      registeredAt: isoFromNow(-6 * DAY),
      dueAt: isoFromNow(9 * DAY),
    }),
    makeRequest({
      id: 'r392',
      protocol: '2026-000392',
      rightNumeral: 'V',
      status: 'concluida',
      registeredAt: isoFromNow(-40 * DAY),
      dueAt: isoFromNow(-25 * DAY),
      closedAt: isoFromNow(-28 * DAY),
      deadline: 'encerrada',
    }),
    makeRequest({
      id: 'r377',
      protocol: '2026-000377',
      rightNumeral: 'IX',
      status: 'cancelada',
      registeredAt: isoFromNow(-60 * DAY),
      dueAt: isoFromNow(-45 * DAY),
      closedAt: isoFromNow(-58 * DAY),
      deadline: 'encerrada',
    }),
  ]
}
