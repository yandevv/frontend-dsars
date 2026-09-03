import { DEMO_REQUESTS } from '@/features/requests/data/requests'
import { DPO_NAME } from '@/features/requests/data/team'
import {
  CANCEL_REASON_MIN_LENGTH,
  LEGAL_DEADLINE_DAYS,
} from '@/features/requests/constants/requestPolicy'
import { REQUEST_OUTCOME_LABELS, isOpen } from '@/features/requests/constants/requestStatus'
import { addDays, formatDate } from '@/shared/utils/date'
import { delay } from '@/features/auth/services/fakeNetwork'
import { findRight } from '@/shared/constants/lgpdRights'
import { uuidv7 } from '@/shared/utils/uuid'
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

/** O identificador da URL não corresponde a nenhuma requisição deste portal. */
export class RequestNotFoundError extends Error {
  constructor(readonly id: string) {
    super(id)
    this.name = 'RequestNotFoundError'
  }
}

export async function listRequests(): Promise<readonly DataRequest[]> {
  await delay()
  return requests
}

/** Busca pelo identificador — é ele, e não o protocolo, que vai na URL. */
export async function fetchRequest(id: string): Promise<DataRequest> {
  await delay()
  return find(id)
}

function find(id: string): DataRequest {
  const request = requests.find((item) => item.id === id)
  if (!request) throw new RequestNotFoundError(id)
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
    id: uuidv7(),
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
  id: string,
  answer: { outcome: RequestOutcome; text: string; legalBasis?: string; author?: string },
): Promise<DataRequest> {
  await delay()

  const request = find(id)

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
  id: string,
  { detail, author = DPO_NAME }: { detail: string; author?: string },
): Promise<DataRequest> {
  await delay()

  const request = find(id)

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
  id: string,
  { to, by = DPO_NAME }: { to: string; by?: string },
): Promise<DataRequest> {
  await delay()

  const request = find(id)

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

/** O que o cancelamento em lote conseguiu fazer — e o que teve de deixar de fora. */
export interface CancelResult {
  cancelled: DataRequest[]
  /** Já estavam concluídas ou canceladas quando o pedido chegou. */
  skipped: DataRequest[]
}

/**
 * Cancela uma ou mais requisições com um motivo único.
 *
 * Só o que ainda está em aberto é cancelado; o resto volta em `skipped` para a
 * tela dizer o que ficou de fora, em vez de falhar o lote inteiro por causa de
 * uma requisição que foi respondida enquanto a pessoa escrevia o motivo.
 */
export async function cancelRequests(ids: readonly string[], reason: string): Promise<CancelResult> {
  await delay()

  const text = reason.trim()
  if (text.length < CANCEL_REASON_MIN_LENGTH) {
    throw new Error(`O motivo precisa de pelo menos ${CANCEL_REASON_MIN_LENGTH} caracteres.`)
  }

  const at = new Date().toISOString()
  const result: CancelResult = { cancelled: [], skipped: [] }

  for (const id of ids) {
    const request = find(id)
    if (!isOpen(request.status)) {
      result.skipped.push(request)
      continue
    }

    request.status = 'cancelada'
    request.closedAt = at
    request.timeline = [
      {
        at,
        title: 'Requisição cancelada pelo titular',
        detail: `Motivo informado: “${text}”. A contagem do prazo foi encerrada.`,
        author: 'Titular',
        highlight: true,
      },
      ...request.timeline,
    ]
    result.cancelled.push(request)
  }

  return result
}
