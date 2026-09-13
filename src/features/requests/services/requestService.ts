import { DEMO_REQUESTS } from '@/features/requests/data/requests'
import { DPO_NAME } from '@/features/requests/data/team'
import {
  CANCEL_REASON_MIN_LENGTH,
  MESSAGE_MAX_LENGTH,
} from '@/features/requests/constants/requestPolicy'
import { REQUEST_OUTCOME_LABELS, isOpen } from '@/features/requests/constants/requestStatus'
import { formatDate } from '@/shared/utils/date'
import { delay } from '@/features/auth/services/fakeNetwork'
import { findRight } from '@/shared/constants/lgpdRights'
import { uuidv7 } from '@/shared/utils/uuid'
import { canEditMessage } from '@/features/requests/utils/messages'
import {
  dueAtFor,
  isImmediate,
  needsAccessFormat,
} from '@/features/requests/utils/responseDeadline'
import { findOriginChannel } from '@/features/requests/constants/originChannels'
import {
  dueFromReceived,
  isCpfShaped,
  isFutureDay,
  receivedAtOf,
  subjectDocument,
} from '@/features/requests/utils/onBehalf'
import { TEAM_INBOX, notify, titularInbox } from '@/features/notifications/composables/useNotifications'
import type {
  AccessFormat,
  DataRequest,
  MessageActor,
  MessageKind,
  NewRequest,
  OnBehalfReceipt,
  OnBehalfRequest,
  RequestAnswer,
  RequestOutcome,
  RequestAttachment,
  RequestMessage,
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

/*
 * Os avisos que o servidor enviaria a cada evento. O e-mail que os acompanha
 * não sai daqui: só o protocolo iria nele, nunca o conteúdo do pedido.
 */
const forTitular = (request: DataRequest) => ({
  name: 'my-request-detail',
  params: { id: request.id },
})
const forTeam = (request: DataRequest) => ({ name: 'request-detail', params: { id: request.id } })

/**
 * O formato só existe no acesso aos dados. Sem ele, vale a declaração completa:
 * é a resposta mais extensa e a de prazo mais longo, nunca um prazo menor do
 * que o titular pediu.
 */
function formatFor(rightNumeral: string, accessFormat?: AccessFormat): AccessFormat | undefined {
  if (!needsAccessFormat(rightNumeral)) return undefined
  return accessFormat ?? 'completo'
}

/** Registra a requisição e devolve o comprovante que a tela exibe (RF004). */
export async function createRequest(
  { rightNumeral, accessFormat, description, attachments }: NewRequest,
  subject: RequestSubject,
): Promise<RequestReceipt> {
  await delay()

  const sequence = nextSequence++
  const protocol = `2026-000${sequence}`
  const registeredAt = new Date().toISOString()
  const format = formatFor(rightNumeral, accessFormat)
  const dueAt = dueAtFor(registeredAt, rightNumeral, format)
  const right = findRight(rightNumeral)

  requests.unshift({
    protocol,
    id: uuidv7(),
    rightNumeral,
    accessFormat: format,
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
    messages: [],
  })

  const created = requests[0]!
  notify(TEAM_INBOX, {
    type: 'Nova requisição',
    tone: 'neutro',
    title: `${right?.requestLabel ?? 'Requisição'} registrada por ${subject.name}`,
    detail: 'Entrou na fila ainda sem responsável designado.',
    reference: `Protocolo ${protocol}`,
    target: forTeam(created),
  })

  return {
    protocol,
    id: created.id,
    rightNumeral: right?.numeral ?? rightNumeral,
    registeredAt,
    dueAt,
    immediate: isImmediate(rightNumeral, format),
    attachmentCount: attachments.length,
  }
}

/** O que impede um registro em nome do titular — as mesmas travas da tela. */
export type OnBehalfRule =
  | 'titular-incompleto'
  | 'identidade-nao-verificada'
  | 'sem-canal'
  | 'data-futura'

export class OnBehalfRuleError extends Error {
  constructor(readonly rule: OnBehalfRule) {
    super(rule)
    this.name = 'OnBehalfRuleError'
  }
}

/**
 * Registra um pedido que chegou fora do portal, em nome do titular (RF004).
 *
 * O prazo conta do dia em que o pedido chegou à organização, não do registro:
 * uma carta digitada duas semanas depois já nasce com o prazo quase esgotado,
 * e isso precisa aparecer na fila em vez de ficar escondido pela demora.
 */
export async function registerOnBehalf(
  input: OnBehalfRequest,
  author: string,
  now: Date = new Date(),
): Promise<OnBehalfReceipt> {
  await delay()

  const { subject } = input
  if (subject.name.trim().length < 3 || !isCpfShaped(subject.cpf)) {
    throw new OnBehalfRuleError('titular-incompleto')
  }
  if (!input.identityVerified) throw new OnBehalfRuleError('identidade-nao-verificada')
  if (!input.channel) throw new OnBehalfRuleError('sem-canal')
  if (!input.receivedOn || isFutureDay(input.receivedOn, now)) {
    throw new OnBehalfRuleError('data-futura')
  }

  const sequence = nextSequence++
  const protocol = `2026-000${sequence}`
  const registeredAt = now.toISOString()
  const receivedAt = receivedAtOf(input.receivedOn, now)
  const format = formatFor(input.rightNumeral, input.accessFormat)
  const dueAt = dueFromReceived(input.receivedOn, isImmediate(input.rightNumeral, format), now)
  const channel = findOriginChannel(input.channel)
  const reference = input.reference?.trim() || undefined
  const right = findRight(input.rightNumeral)
  const origin = { channel: input.channel, reference, receivedAt, registeredBy: author }

  requests.unshift({
    protocol,
    id: uuidv7(now.getTime()),
    rightNumeral: input.rightNumeral,
    accessFormat: format,
    description: input.description.trim(),
    status: 'em-analise',
    subject: {
      name: subject.name.trim(),
      email: subject.email.trim(),
      document: subjectDocument(subject.cpf),
      verifiedAt: registeredAt,
    },
    registeredAt,
    dueAt,
    assignee: author,
    channel: reference ? `${channel.label} · ${reference}` : channel.label,
    origin,
    attachments: input.attachments,
    timeline: [
      {
        at: registeredAt,
        title: 'Requisição registrada em nome do titular',
        detail: `Pedido recebido ${channel.phrase} em ${formatDate(receivedAt)} e registrado por ${author}, com a identidade do titular verificada. Protocolo ${protocol}. Prazo legal: ${formatDate(dueAt)}, contado do recebimento.`,
        author,
      },
    ],
    notes: [],
    messages: [],
  })

  const created = requests[0]!
  // Sem conta não há caixa de avisos: o comprovante vai pelo canal de origem.
  if (subject.hasAccount && subject.email.trim()) {
    notify(titularInbox(subject.email.trim()), {
      type: 'Nova requisição',
      tone: 'neutro',
      title: `A encarregada registrou a ${protocol} a seu pedido`,
      detail: `${right?.requestLabel ?? 'Pedido'} recebido ${channel.phrase} em ${formatDate(receivedAt)}. Se você não reconhece este pedido, avise a encarregada.`,
      reference: `Protocolo ${protocol}`,
      target: forTitular(created),
    })
  }

  return {
    protocol,
    id: created.id,
    rightNumeral: right?.numeral ?? input.rightNumeral,
    registeredAt,
    dueAt,
    immediate: isImmediate(input.rightNumeral, format),
    attachmentCount: input.attachments.length,
    subjectName: created.subject.name,
    subjectHasAccount: subject.hasAccount,
    origin,
  }
}

/**
 * Por que uma operação sobre mensagens foi recusada.
 *
 * As mesmas regras valem no servidor; aqui elas existem para que a tela possa
 * explicar a recusa em vez de só falhar.
 */
export type MessageRule =
  | 'requisicao-encerrada'
  | 'nao-e-autor'
  | 'prazo-de-edicao'
  | 'mensagem-vazia'
  | 'mensagem-longa'
  | 'sem-resultado'

export class MessageRuleError extends Error {
  constructor(readonly rule: MessageRule) {
    super(rule)
    this.name = 'MessageRuleError'
  }
}

function assertOpen(request: DataRequest) {
  if (!isOpen(request.status)) throw new MessageRuleError('requisicao-encerrada')
}

function assertContent(text: string, attachments: readonly RequestAttachment[]) {
  if (text.length > MESSAGE_MAX_LENGTH) throw new MessageRuleError('mensagem-longa')
  if (text.length === 0 && attachments.length === 0) throw new MessageRuleError('mensagem-vazia')
}

function findMessage(request: DataRequest, messageId: string, actor: MessageActor): RequestMessage {
  const message = request.messages.find((item) => item.id === messageId && !item.deletedAt)
  if (!message) throw new MessageRuleError('nao-e-autor')
  if (message.authorRole !== actor.role || message.author !== actor.name) {
    throw new MessageRuleError('nao-e-autor')
  }
  return message
}

/**
 * Registra uma mensagem na conversa (RF006).
 *
 * Duas mensagens mexem no estado: o pedido de complemento põe a requisição à
 * espera do titular, e a primeira mensagem do titular depois dele a devolve à
 * análise. Em nenhum dos dois casos o prazo para.
 */
export async function sendMessage(
  id: string,
  {
    text,
    attachments = [],
    actor,
    kind = 'mensagem',
  }: {
    text: string
    attachments?: readonly RequestAttachment[]
    actor: MessageActor
    kind?: Exclude<MessageKind, 'parecer'>
  },
): Promise<DataRequest> {
  await delay()

  const request = find(id)
  assertOpen(request)

  const content = text.trim()
  assertContent(content, attachments)

  const sentAt = new Date().toISOString()
  request.messages = [
    ...request.messages,
    {
      id: uuidv7(),
      kind,
      author: actor.name,
      authorRole: actor.role,
      text: content,
      attachments: [...attachments],
      sentAt,
    },
  ]

  if (kind === 'complemento') {
    request.status = 'aguardando-complemento'
    request.timeline = [
      {
        at: sentAt,
        title: 'Complemento solicitado ao titular',
        detail: 'Pedido enviado pelo portal e por e-mail. O prazo legal continua correndo.',
        author: actor.name,
        highlight: true,
      },
      ...request.timeline,
    ]
  }

  const answeringComplement =
    actor.role === 'titular' && request.status === 'aguardando-complemento'

  if (actor.role === 'encarregado') {
    notify(titularInbox(request.subject.email), {
      type: kind === 'complemento' ? 'Complemento solicitado' : 'Nova mensagem',
      tone: 'pendencia',
      title:
        kind === 'complemento'
          ? `Precisamos de uma informação para seguir com a ${request.protocol}`
          : `A equipe escreveu na requisição ${request.protocol}`,
      detail:
        kind === 'complemento'
          ? 'Responda pela própria requisição. O prazo legal continua correndo durante a espera.'
          : 'Abra a requisição para ler a mensagem e responder.',
      reference: `Protocolo ${request.protocol}`,
      target: forTitular(request),
    })
  } else {
    notify(TEAM_INBOX, {
      type: answeringComplement ? 'Complemento recebido' : 'Nova mensagem',
      tone: 'pendencia',
      title: answeringComplement
        ? `O titular da ${request.protocol} enviou o complemento pedido`
        : `Nova mensagem do titular na ${request.protocol}`,
      detail: answeringComplement
        ? 'A requisição voltou para análise.'
        : 'Abra a requisição para ler e responder pela conversa.',
      reference: `Protocolo ${request.protocol}`,
      target: forTeam(request),
    })
  }

  if (answeringComplement) {
    request.status = 'em-analise'
    request.timeline = [
      {
        at: sentAt,
        title: 'Complemento enviado pelo titular',
        detail: 'A requisição voltou para análise. O prazo legal seguiu correndo durante a espera.',
        author: 'Titular',
        highlight: true,
      },
      ...request.timeline,
    ]
  }

  return request
}

/**
 * Corrige o texto de uma mensagem própria, dentro da janela de edição (RF013).
 *
 * A conversa passa a mostrar a mensagem como editada; o texto anterior fica
 * na trilha de auditoria, que não é editável por ninguém.
 */
export async function editMessage(
  id: string,
  messageId: string,
  { text, actor }: { text: string; actor: MessageActor },
  now: Date = new Date(),
): Promise<DataRequest> {
  await delay()

  const request = find(id)
  assertOpen(request)
  const message = findMessage(request, messageId, actor)
  if (!canEditMessage(message, now)) throw new MessageRuleError('prazo-de-edicao')

  const content = text.trim()
  assertContent(content, message.attachments)

  const editedAt = now.toISOString()
  request.messages = request.messages.map((item) =>
    item.id === messageId ? { ...item, text: content, editedAt } : item,
  )
  request.timeline = [
    {
      at: editedAt,
      title: 'Mensagem editada',
      detail: `Texto anterior: “${message.text}”`,
      author: actor.role === 'titular' ? 'Titular' : actor.name,
      internal: true,
    },
    ...request.timeline,
  ]

  return request
}

/**
 * Tira uma mensagem própria da conversa (RF014).
 *
 * Nada é apagado de fato: a mensagem some para os participantes e o conteúdo
 * continua na trilha, para prestação de contas.
 */
export async function deleteMessage(
  id: string,
  messageId: string,
  { actor }: { actor: MessageActor },
): Promise<DataRequest> {
  await delay()

  const request = find(id)
  assertOpen(request)
  const message = findMessage(request, messageId, actor)

  const deletedAt = new Date().toISOString()
  request.messages = request.messages.map((item) =>
    item.id === messageId ? { ...item, deletedAt } : item,
  )
  request.timeline = [
    {
      at: deletedAt,
      title: 'Mensagem excluída',
      detail: `Conteúdo removido da conversa: “${message.text || 'mensagem só com anexo'}”`,
      author: actor.role === 'titular' ? 'Titular' : actor.name,
      internal: true,
    },
    ...request.timeline,
  ]

  return request
}

/**
 * Encerra o atendimento com o parecer conclusivo (RF007).
 *
 * O parecer entra na conversa como a última mensagem, com o resultado anexado,
 * e a partir daí a requisição não aceita mais mensagens nem reabertura.
 */
export async function answerRequest(
  id: string,
  answer: {
    outcome: RequestOutcome
    text: string
    legalBasis?: string
    attachments: readonly RequestAttachment[]
    author?: string
  },
): Promise<DataRequest> {
  await delay()

  const request = find(id)
  assertOpen(request)
  if (answer.attachments.length === 0) throw new MessageRuleError('sem-resultado')

  const sentAt = new Date().toISOString()
  const author = answer.author ?? DPO_NAME
  const text = answer.text.trim()
  const sent: RequestAnswer = {
    outcome: answer.outcome,
    text,
    legalBasis: answer.legalBasis,
    attachments: [...answer.attachments],
    sentAt,
    author,
  }

  request.status = 'concluida'
  request.closedAt = sentAt
  request.answer = sent
  request.messages = [
    ...request.messages,
    {
      id: uuidv7(),
      kind: 'parecer',
      author,
      authorRole: 'encarregado',
      text,
      attachments: [...answer.attachments],
      sentAt,
    },
  ]
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

  const inbox = titularInbox(request.subject.email)
  notify(inbox, {
    type: 'Requisição concluída',
    tone: 'neutro',
    title: `A resposta à ${request.protocol} está disponível`,
    detail: `Desfecho: ${REQUEST_OUTCOME_LABELS[answer.outcome].toLowerCase()}. A resposta e os anexos estão na própria requisição.`,
    reference: `Protocolo ${request.protocol}`,
    target: forTitular(request),
  })
  notify(inbox, {
    type: 'Pesquisa de satisfação',
    tone: 'neutro',
    title: `Como foi o atendimento da ${request.protocol}?`,
    detail:
      'Uma pergunta de nota e um campo livre. As respostas entram no relatório sem identificar quem respondeu.',
    reference: `Protocolo ${request.protocol}`,
    target: { ...forTitular(request), query: { pesquisa: '1' } },
  })

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
      internal: true,
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
    notify(TEAM_INBOX, {
      type: 'Requisição cancelada',
      tone: 'neutro',
      title: `O titular cancelou o protocolo ${request.protocol}`,
      detail: `Motivo informado: “${text}”. A requisição saiu da fila.`,
      reference: `Protocolo ${request.protocol}`,
      target: forTeam(request),
    })
  }

  return result
}
