import { findOriginChannel } from '@/features/requests/constants/originChannels'
import { deadlineOf, formatOf, numeralOf, statusOf } from '@/shared/api/enums'
import { formatBytes } from '@/shared/utils/bytes'
import { formatDate } from '@/shared/utils/date'
import type {
  ApiAttachment,
  ApiMessage,
  ApiRequestDetails,
  ApiRequestSummary,
  ApiSurveyState,
} from '@/shared/api/contracts'
import type {
  DataRequest,
  OriginChannel,
  RequestAnswer,
  RequestAttachment,
  RequestMessage,
  RequestTimelineEntry,
  SurveyAnswer,
} from '@/features/requests/types/request'

/**
 * Tradução das respostas da API para os tipos da interface.
 *
 * As telas seguem lendo uma `DataRequest` inteira; o que a API entrega em
 * partes — detalhe, conversa, pesquisa — é juntado aqui.
 */

const KIND_LABEL: Record<string, string> = {
  'application/pdf': 'PDF',
  'image/png': 'PNG',
  'image/jpeg': 'JPG',
}

export function toAttachment(attachment: ApiAttachment): RequestAttachment {
  const kind = KIND_LABEL[attachment.contentType] ?? 'Arquivo'
  return {
    id: attachment.id,
    name: attachment.fileName,
    meta: `${kind} · ${formatBytes(attachment.sizeBytes)} · enviado em ${formatDate(attachment.createdAt)}`,
  }
}

export function toMessage(message: ApiMessage): RequestMessage {
  const editable =
    message.editableUntil !== null && new Date(message.editableUntil).getTime() > Date.now()
  return {
    id: message.id,
    kind: message.isConclusive ? 'parecer' : 'mensagem',
    author: message.author.fullName,
    authorRole: message.author.role === 'DPO' ? 'encarregado' : 'titular',
    text: message.body ?? '',
    attachments: message.attachments.map(toAttachment),
    sentAt: message.createdAt,
    editedAt: message.edited ? (message.editedAt ?? undefined) : undefined,
    mine: message.mine,
    editableUntil: editable ? (message.editableUntil ?? undefined) : undefined,
  }
}

function channelLabel(channel: ApiRequestDetails['channel'], details: string | null): string {
  if (channel === 'PLATFORM') return 'Portal do titular'
  const label = findOriginChannel(channel as OriginChannel).label
  return details ? `${label} · ${details}` : label
}

/** Uma linha da lista: o que a listagem traz, com o resto vazio até abrir o detalhe. */
export function fromSummary(summary: ApiRequestSummary): DataRequest {
  return {
    protocol: summary.protocolNumber,
    id: summary.id,
    rightNumeral: numeralOf(summary.rights[0] ?? 'PROCESSING_CONFIRMATION'),
    description: '',
    status: statusOf(summary.status),
    subject: {
      id: summary.dataSubject?.id,
      name: summary.dataSubject?.fullName ?? '',
      email: '',
    },
    registeredAt: summary.registeredAt,
    dueAt: summary.dueAt,
    deadline: deadlineOf(summary.deadlineStatus),
    closedAt: summary.closedAt ?? undefined,
    channel: '',
    attachments: [],
    timeline: [],
    messages: [],
  }
}

function toSurvey(state: ApiSurveyState | null): SurveyAnswer | undefined {
  const response = state?.response
  if (!response) return undefined
  return {
    rating: response.rating,
    comment: response.comment ?? undefined,
    answeredAt: response.respondedAt,
  }
}

function answerOf(messages: readonly RequestMessage[]): RequestAnswer | undefined {
  const conclusive = messages.find((message) => message.kind === 'parecer')
  if (!conclusive) return undefined
  return {
    text: conclusive.text,
    attachments: conclusive.attachments,
    sentAt: conclusive.sentAt,
    author: conclusive.author,
  }
}

/**
 * O histórico visível aos participantes, montado a partir do que se sabe do
 * pedido. A trilha completa, com cada acesso, fica no servidor.
 */
export function timelineOf(request: DataRequest, onBehalf: boolean): RequestTimelineEntry[] {
  const entries: RequestTimelineEntry[] = [
    {
      at: request.registeredAt,
      title: onBehalf ? 'Requisição registrada em nome do titular' : 'Requisição registrada',
      detail: `Protocolo ${request.protocol}${
        onBehalf && request.origin
          ? `, recebido ${findOriginChannel(request.origin.channel).phrase}`
          : ''
      }. Prazo legal: ${formatDate(request.dueAt)}.`,
      author: onBehalf ? 'Encarregada' : 'Titular',
    },
  ]

  for (const message of request.messages) {
    if (message.kind === 'parecer') continue
    entries.push({
      at: message.sentAt,
      title: message.authorRole === 'encarregado' ? 'Mensagem da equipe' : 'Mensagem do titular',
      detail: message.editedAt ? 'Mensagem enviada e depois editada.' : 'Mensagem enviada pela conversa.',
      author: message.author,
    })
  }

  if (request.status === 'concluida' && request.closedAt) {
    entries.push({
      at: request.closedAt,
      title: 'Atendimento finalizado',
      detail: 'Parecer conclusivo enviado ao titular, com o resultado anexado.',
      author: request.answer?.author ?? 'Encarregada',
    })
  }
  if (request.status === 'cancelada' && request.closedAt) {
    entries.push({
      at: request.closedAt,
      title: 'Requisição cancelada pelo titular',
      detail: request.cancellationReason
        ? `Motivo informado: “${request.cancellationReason}”. A contagem do prazo foi encerrada.`
        : 'A contagem do prazo foi encerrada.',
      author: 'Titular',
    })
  }
  if (request.survey) {
    entries.push({
      at: request.survey.answeredAt,
      title: 'Pesquisa de satisfação respondida',
      detail: 'A avaliação entra no relatório sem identificar quem respondeu.',
      author: 'Titular',
    })
  }

  const sorted = entries.sort((a, b) => b.at.localeCompare(a.at))
  if (sorted[0]) sorted[0] = { ...sorted[0], highlight: true }
  return sorted
}

/** O detalhe inteiro: requisição, conversa e, para o titular, a pesquisa. */
export function fromDetails(
  details: ApiRequestDetails,
  apiMessages: readonly ApiMessage[],
  survey: ApiSurveyState | null,
  viewer: { name: string; email: string },
): DataRequest {
  const messages = apiMessages.map(toMessage)
  const onBehalf = details.registeredOnBehalf
  const numeral = numeralOf(details.rights[0] ?? 'PROCESSING_CONFIRMATION')
  const hasFormat = numeral === 'I' || numeral === 'II'

  const request: DataRequest = {
    protocol: details.protocolNumber,
    id: details.id,
    rightNumeral: numeral,
    accessFormat: hasFormat ? formatOf(details.responseFormat) : undefined,
    description: details.description,
    status: statusOf(details.status),
    // O titular não recebe os próprios dados de volta: são os da sessão.
    subject: details.dataSubject
      ? {
          id: details.dataSubject.id,
          name: details.dataSubject.fullName,
          email: details.dataSubject.email,
        }
      : { name: viewer.name, email: viewer.email },
    registeredAt: details.registeredAt,
    dueAt: details.dueAt,
    deadline: deadlineOf(details.deadlineStatus),
    closedAt: details.closedAt ?? undefined,
    cancellationReason: details.cancellationReason ?? undefined,
    channel: channelLabel(details.channel, details.channelDetails),
    origin:
      onBehalf && details.channel !== 'PLATFORM'
        ? {
            channel: details.channel as OriginChannel,
            reference: details.channelDetails ?? undefined,
          }
        : undefined,
    attachments: details.attachments.map(toAttachment),
    timeline: [],
    messages,
    answer: answerOf(messages),
    survey: toSurvey(survey),
  }

  return { ...request, timeline: timelineOf(request, onBehalf) }
}
