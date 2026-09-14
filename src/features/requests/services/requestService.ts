import { http } from '@/shared/api/http'
import { isApiError } from '@/shared/api/ApiError'
import { apiFormatOf, rightOf } from '@/shared/api/enums'
import { sessionAccount } from '@/features/auth/composables/useSession'
import { useTenant } from '@/features/tenant/composables/useTenant'
import { responseFormatFor, requestIsImmediate } from '@/features/requests/utils/responseDeadline'
import { fromDetails, fromSummary, toMessage } from '@/features/requests/services/mappers'
import type {
  ApiBulkCancellation,
  ApiClosedRequest,
  ApiDownloadLink,
  ApiMessage,
  ApiRegisteredRequest,
  ApiRequestDetails,
  ApiRequestSummary,
  ApiSurveyState,
  Page,
} from '@/shared/api/contracts'
import type {
  DataRequest,
  NewRequest,
  OnBehalfReceipt,
  OnBehalfRequest,
  RequestAttachment,
  RequestMessage,
  RequestReceipt,
} from '@/features/requests/types/request'

/**
 * Requisições de titulares, contra a API.
 *
 * O servidor é quem decide o que cada perfil vê: o titular recebe só as
 * próprias requisições, e o encarregado, só as da organização a que está
 * vinculado. Protocolo, identificador e prazo também nascem lá.
 */

/** A API aceita no máximo 50 por página; as listas buscam todas as páginas. */
const PAGE_SIZE = 50

/** O identificador da URL não corresponde a nenhuma requisição visível. */
export class RequestNotFoundError extends Error {
  constructor(readonly id: string) {
    super(id)
    this.name = 'RequestNotFoundError'
  }
}

/** A organização da sessão do encarregado — é ela que vai nas rotas da equipe. */
export function organizationId(): string {
  const id = sessionAccount()?.organizationId
  if (!id) throw new Error('A sessão não tem organização vinculada.')
  return id
}

function filesOf(attachments: readonly RequestAttachment[]): File[] {
  return attachments.flatMap((attachment) => (attachment.file ? [attachment.file] : []))
}

async function allPages(path: string): Promise<DataRequest[]> {
  const items: ApiRequestSummary[] = []
  for (let page = 1; ; page += 1) {
    const result = await http.get<Page<ApiRequestSummary>>(path, {
      query: { page, pageSize: PAGE_SIZE },
    })
    items.push(...result.items)
    if (items.length >= result.total || result.items.length === 0) break
  }
  return items.map(fromSummary)
}

/** As requisições da própria conta, como titular. */
export function listMyRequests(): Promise<DataRequest[]> {
  return allPages('/me/requests')
}

/** A fila da organização do encarregado. */
export function listOrganizationRequests(): Promise<DataRequest[]> {
  return allPages(`/organizations/${organizationId()}/requests`)
}

/**
 * O detalhe completo: dados do pedido, a conversa e, para o titular de um
 * pedido concluído, a pesquisa de satisfação.
 */
export async function fetchRequest(id: string): Promise<DataRequest> {
  let details: ApiRequestDetails
  try {
    details = await http.get<ApiRequestDetails>(`/requests/${id}`)
  } catch (error) {
    // Pedido inexistente e pedido alheio dão a mesma resposta: a tela não
    // confirma que um identificador existe.
    if (isApiError(error, 404) || isApiError(error, 403) || isApiError(error, 400)) {
      throw new RequestNotFoundError(id)
    }
    throw error
  }

  const isSubject = details.viewerRoles.includes('DATA_SUBJECT')
  const [messages, survey] = await Promise.all([
    http.get<{ items: ApiMessage[] }>(`/requests/${id}/messages`),
    isSubject && details.status === 'COMPLETED'
      ? http.get<ApiSurveyState>(`/requests/${id}/survey`).catch(() => null)
      : Promise.resolve(null),
  ])

  const viewer = sessionAccount()
  return fromDetails(details, messages.items, survey, {
    name: viewer?.name ?? '',
    email: viewer?.email ?? '',
  })
}

function receiptOf(registered: ApiRegisteredRequest, numeral: string): RequestReceipt {
  return {
    protocol: registered.protocolNumber,
    id: registered.id,
    rightNumeral: numeral,
    registeredAt: registered.registeredAt,
    dueAt: registered.dueAt,
    immediate: requestIsImmediate(registered),
    attachmentCount: registered.attachments.length,
  }
}

function registrationBody({ rightNumeral, accessFormat, description }: NewRequest) {
  const format = responseFormatFor(rightNumeral, accessFormat)
  return {
    rights: [rightOf(rightNumeral)],
    responseFormat: format ? apiFormatOf(format) : undefined,
    description: description.trim(),
  }
}

/** Registra a requisição pelo portal da organização e devolve o comprovante (RF004). */
export async function createRequest(input: NewRequest): Promise<RequestReceipt> {
  const { tenant } = useTenant()
  const registered = await http.upload<ApiRegisteredRequest>(
    `/portal/${encodeURIComponent(tenant.slug)}/requests`,
    registrationBody(input),
    filesOf(input.attachments),
  )
  return receiptOf(registered, input.rightNumeral)
}

/**
 * Registra um pedido que chegou fora do portal, em nome do titular (RF004).
 *
 * O servidor exige que o titular tenha conta ativa e com e-mail confirmado:
 * é ela que recebe os avisos e acompanha o pedido.
 */
export async function registerOnBehalf(input: OnBehalfRequest): Promise<OnBehalfReceipt> {
  if (!input.channel) throw new Error('Informe o canal de origem do pedido.')
  const reference = input.reference?.trim() || undefined
  const subjectEmail = input.subjectEmail.trim().toLowerCase()

  const registered = await http.upload<ApiRegisteredRequest>(
    `/organizations/${organizationId()}/requests`,
    {
      ...registrationBody(input),
      dataSubjectEmail: subjectEmail,
      channel: input.channel,
      channelDetails: reference,
    },
    filesOf(input.attachments),
  )

  return {
    ...receiptOf(registered, input.rightNumeral),
    subjectEmail,
    origin: { channel: input.channel, reference },
  }
}

// ── Conversa ────────────────────────────────────────────────────────────────

/** Envia uma mensagem: texto, anexos ou os dois (RF006 / RN024). */
export async function sendMessage(
  id: string,
  { text, attachments = [] }: { text: string; attachments?: readonly RequestAttachment[] },
): Promise<RequestMessage> {
  const body = text.trim()
  return toMessage(
    await http.upload<ApiMessage>(
      `/requests/${id}/messages`,
      { body: body || undefined },
      filesOf(attachments),
    ),
  )
}

/** Corrige o texto de uma mensagem própria, dentro da janela de edição (RF013). */
export async function editMessage(
  id: string,
  messageId: string,
  text: string,
): Promise<RequestMessage> {
  return toMessage(
    await http.patch<ApiMessage>(`/requests/${id}/messages/${messageId}`, { body: text.trim() }),
  )
}

/** Tira uma mensagem própria da conversa; o conteúdo continua na trilha (RF014). */
export async function deleteMessage(id: string, messageId: string): Promise<void> {
  await http.delete(`/requests/${id}/messages/${messageId}`)
}

/**
 * Encerra o atendimento com o parecer conclusivo e o resultado anexado
 * (RF007 / RN028). Depois disso a requisição não aceita mais mensagens.
 */
export async function answerRequest(
  id: string,
  { text, attachments }: { text: string; attachments: readonly RequestAttachment[] },
): Promise<void> {
  await http.upload<ApiClosedRequest>(
    `/requests/${id}/complete`,
    { body: text.trim() },
    filesOf(attachments),
  )
}

// ── Cancelamento ────────────────────────────────────────────────────────────

/** Por que uma requisição ficou de fora do cancelamento em lote. */
export type CancelRejection = 'NOT_FOUND' | 'NOT_ALLOWED' | 'NOT_OPEN'

/** O que o cancelamento em lote conseguiu fazer — e o que teve de deixar de fora. */
export interface CancelResult {
  cancelled: { id: string; protocol: string }[]
  skipped: { id: string; protocol?: string; reason: CancelRejection }[]
}

/**
 * Cancela uma ou mais requisições com um motivo único.
 *
 * Só o que ainda está em aberto é cancelado; o resto volta em `skipped` para a
 * tela dizer o que ficou de fora, em vez de falhar o lote inteiro por causa de
 * uma requisição que foi respondida enquanto a pessoa escrevia o motivo.
 */
export async function cancelRequests(
  ids: readonly string[],
  reason: string,
): Promise<CancelResult> {
  const result = await http.post<ApiBulkCancellation>('/me/requests/cancel', {
    ids,
    reason: reason.trim(),
  })
  return {
    cancelled: result.cancelled.map((item) => ({ id: item.id, protocol: item.protocolNumber })),
    skipped: result.rejected.map((item) => ({
      id: item.id,
      protocol: item.protocolNumber,
      reason: item.reason,
    })),
  }
}

// ── Anexos ──────────────────────────────────────────────────────────────────

/** Abre o link temporário do anexo; o servidor registra o download. */
export async function downloadAttachment(requestId: string, attachmentId: string): Promise<void> {
  const link = await http.get<ApiDownloadLink>(
    `/requests/${requestId}/attachments/${attachmentId}/download`,
  )
  window.location.assign(link.url)
}
