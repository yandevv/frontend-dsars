import { DEMO_REQUESTS } from '@/features/requests/data/requests'
import { DPO_NAME } from '@/features/requests/data/team'
import { LEGAL_DEADLINE_DAYS } from '@/features/requests/constants/requestPolicy'
import { REQUEST_OUTCOME_LABELS } from '@/features/requests/constants/requestStatus'
import { addDays, formatDate } from '@/shared/utils/date'
import { delay } from '@/features/auth/services/fakeNetwork'
import { findRight } from '@/shared/constants/lgpdRights'
import type {
  DataRequest,
  NewRequest,
  RequestAnswer,
  RequestOutcome,
  RequestReceipt,
  RequestSubject,
} from '@/features/requests/types/request'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ATENÇÃO — este módulo é o lugar onde a API de requisições vai entrar.
 *
 * Cumpre para o atendimento o mesmo papel que `sessionService.ts` cumpre para
 * as contas: as telas já conversam com estas funções, inclusive nos casos de
 * recusa, e responder de verdade é trocar o corpo delas por chamadas HTTP, sem
 * tocar em componente nenhum.
 *
 * Duas coisas que não sobrevivem ao back-end e por isso ficam anotadas: o
 * protocolo é gerado aqui, e num sistema real ele é gerado pelo servidor, que
 * é quem garante que dois pedidos simultâneos não recebam o mesmo número; e
 * nada é persistido — recarregar a página devolve a fila ao estado inicial.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Cópia viva das requisições: é o que as telas alteram enquanto navegam. */
const requests: DataRequest[] = DEMO_REQUESTS.map((request) => ({ ...request }))

/** Continua a numeração de onde a fila de demonstração parou. */
let nextSequence = 461

export class RequestNotFoundError extends Error {
  constructor(readonly protocol: string) {
    super(protocol)
    this.name = 'RequestNotFoundError'
  }
}

export async function listRequests(): Promise<readonly DataRequest[]> {
  await delay()
  return requests
}

export async function fetchRequest(protocol: string): Promise<DataRequest> {
  await delay()

  const request = requests.find((item) => item.protocol === protocol)
  if (!request) throw new RequestNotFoundError(protocol)
  return request
}

/** Registra a requisição e devolve o comprovante que a tela exibe (RF004). */
export async function createRequest(
  { rightNumeral, description, attachments }: NewRequest,
  subject: RequestSubject,
): Promise<RequestReceipt> {
  await delay()

  const sequence = nextSequence++
  const protocol = `2026-000${sequence}`
  const registeredAt = new Date().toISOString()
  const dueAt = addDays(registeredAt, LEGAL_DEADLINE_DAYS)
  const right = findRight(rightNumeral)

  requests.unshift({
    protocol,
    id: `req_${randomHex()}-2026-0${sequence}`,
    rightNumeral,
    description: description.trim(),
    status: 'em-analise',
    subject,
    registeredAt,
    dueAt,
    channel: 'Portal do titular, com conta verificada',
    attachments,
    timeline: [
      {
        at: registeredAt,
        title: 'Requisição registrada',
        detail: `Protocolo ${protocol} gerado pelo portal do titular. Prazo legal: ${formatDate(dueAt)}.`,
        author: 'Titular',
      },
    ],
    notes: [],
  })

  return {
    protocol,
    id: requests[0]!.id,
    rightNumeral: right?.numeral ?? rightNumeral,
    registeredAt,
    dueAt,
    attachmentCount: attachments.length,
  }
}

/** Encerra o atendimento com a resposta ao titular (RF013). */
export async function answerRequest(
  protocol: string,
  answer: { outcome: RequestOutcome; text: string; legalBasis?: string; author?: string },
): Promise<DataRequest> {
  await delay()

  const request = requests.find((item) => item.protocol === protocol)
  if (!request) throw new RequestNotFoundError(protocol)

  const sentAt = new Date().toISOString()
  const author = answer.author ?? DPO_NAME
  const sent: RequestAnswer = {
    outcome: answer.outcome,
    text: answer.text.trim(),
    legalBasis: answer.legalBasis,
    sentAt,
    author,
  }

  request.status = 'concluida'
  request.closedAt = sentAt
  request.answer = sent
  request.timeline = [
    {
      at: sentAt,
      title: `Atendimento finalizado · ${REQUEST_OUTCOME_LABELS[answer.outcome]}`,
      detail:
        'Resposta enviada ao titular e notificação disparada. Pesquisa de satisfação liberada.',
      author,
      highlight: true,
    },
    ...request.timeline,
  ]

  return request
}

/** Mantém a requisição na fila à espera do titular — o prazo não para. */
export async function askForComplement(
  protocol: string,
  { detail, author = DPO_NAME }: { detail: string; author?: string },
): Promise<DataRequest> {
  await delay()

  const request = requests.find((item) => item.protocol === protocol)
  if (!request) throw new RequestNotFoundError(protocol)

  const at = new Date().toISOString()
  request.status = 'aguardando-complemento'
  request.timeline = [
    {
      at,
      title: 'Complemento solicitado ao titular',
      detail,
      author,
      highlight: true,
    },
    ...request.timeline,
  ]

  return request
}

/** Passa a requisição a outra pessoa da equipe, deixando registro (RF014). */
export async function reassignRequest(
  protocol: string,
  { to, by = DPO_NAME }: { to: string; by?: string },
): Promise<DataRequest> {
  await delay()

  const request = requests.find((item) => item.protocol === protocol)
  if (!request) throw new RequestNotFoundError(protocol)

  const previous = request.assignee
  request.assignee = to
  request.timeline = [
    {
      at: new Date().toISOString(),
      title: 'Requisição reatribuída',
      detail: previous
        ? `De ${previous} para ${to}. A nova responsável recebe notificação com o prazo restante.`
        : `Atribuída a ${to}, que recebe notificação com o prazo restante.`,
      author: by,
      highlight: true,
    },
    ...request.timeline,
  ]

  return request
}

function randomHex(): string {
  return Math.floor(Math.random() * 0xffffffff)
    .toString(16)
    .padStart(8, '0')
}
