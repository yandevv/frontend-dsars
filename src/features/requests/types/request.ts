/**
 * Como o titular quer receber o acesso aos dados (art. 18, II): o formato
 * simplificado sai em até 24 horas; a declaração completa — origem, critérios
 * e finalidade — tem até 15 dias.
 */
export type AccessFormat = 'simplificado' | 'completo'

/**
 * Estados possíveis de uma requisição. São os três do documento de
 * requisitos: aberta enquanto consome prazo, e depois concluída pela
 * encarregada ou cancelada pelo titular.
 */
export type RequestStatus = 'aberta' | 'concluida' | 'cancelada'

/**
 * Situação do prazo legal, calculada pelo servidor a partir do vencimento.
 *
 * É um dado derivado, nunca guardado: uma requisição gravada como "em dia"
 * continuaria em dia depois de vencer.
 */
export type DeadlineStatus = 'vencida' | 'proxima' | 'em-dia' | 'encerrada'

export interface RequestAttachment {
  /** Identificador do anexo guardado; ausente enquanto só existe no navegador. */
  id?: string
  name: string
  /** Linha de apoio já formatada — "PDF · 480 KB · enviado em 27/08/2026". */
  meta: string
  /** O arquivo escolhido no aparelho, antes do envio. */
  file?: File
}

/** Entrada do histórico da requisição, montada a partir dos eventos conhecidos. */
export interface RequestTimelineEntry {
  at: string
  title: string
  detail: string
  author: string
  /** O que acabou de acontecer, destacado no alto do histórico. */
  highlight?: boolean
}

/** Quem abriu a requisição, do ponto de vista de quem vai atendê-la. */
export interface RequestSubject {
  /** Identificador da conta do titular, quando o servidor o informa. */
  id?: string
  name: string
  email: string
}

/** Quem escreveu uma mensagem, pelo papel que ocupa na requisição. */
export type MessageAuthorRole = 'titular' | 'encarregado'

/**
 * O que a mensagem representa na conversa. `parecer` é a resposta conclusiva
 * que encerra o atendimento.
 */
export type MessageKind = 'mensagem' | 'parecer'

/** Uma mensagem trocada dentro da requisição (RF006 / RF012). */
export interface RequestMessage {
  id: string
  kind: MessageKind
  author: string
  authorRole: MessageAuthorRole
  text: string
  attachments: readonly RequestAttachment[]
  sentAt: string
  /** Presente depois de uma edição — a conversa sinaliza, a trilha guarda o original. */
  editedAt?: string
  /** Escrita por quem está na tela: só essas podem ser editadas ou excluídas. */
  mine: boolean
  /** Até quando a edição é aceita; ausente quando já não cabe editar. */
  editableUntil?: string
}

/** Resposta conclusiva enviada ao titular ao encerrar o atendimento. */
export interface RequestAnswer {
  text: string
  /** O resultado entregue — relatório, comprovante, arquivo de portabilidade. */
  attachments: readonly RequestAttachment[]
  sentAt: string
  author: string
}

/** Por onde chegou um pedido feito fora do portal — os canais da API. */
export type OriginChannel = 'EMAIL' | 'PHONE' | 'IN_PERSON' | 'POSTAL_MAIL' | 'OTHER'

/** O rastro do registro por terceiro (RF004 / RN018). */
export interface RequestOrigin {
  channel: OriginChannel
  /** Número do atendimento, da carta ou do ofício, que liga ao original guardado fora. */
  reference?: string
}

/** A avaliação do titular: uma por requisição, sem edição depois do envio. */
export interface SurveyAnswer {
  /** De 1 (muito insatisfatório) a 5 (muito satisfatório). */
  rating: number
  comment?: string
  answeredAt: string
}

/**
 * Uma requisição de titular de dados, do registro ao encerramento.
 *
 * O direito exercido é guardado pelo numeral do inciso, e não pelo nome: o
 * nome é texto de interface e pode ser reescrito, o inciso é a lei.
 */
export interface DataRequest {
  /** O que o titular guarda e cita à organização ou à ANPD. */
  protocol: string
  /** Identificador (UUID v7), usado na URL. */
  id: string
  rightNumeral: string
  /** Só no acesso e na confirmação: é o formato que decide o prazo. */
  accessFormat?: AccessFormat
  description: string
  status: RequestStatus
  subject: RequestSubject
  registeredAt: string
  /** Vencimento do prazo do art. 19, contado do registro. */
  dueAt: string
  /** Situação do prazo, como o servidor a calculou. */
  deadline: DeadlineStatus
  /** Quando saiu da fila — respondida ou cancelada pelo titular. */
  closedAt?: string
  cancellationReason?: string
  /** O canal em palavras — "Portal do titular", "E-mail · ofício 12". */
  channel: string
  /** Presente quando a encarregada registrou o pedido em nome do titular. */
  origin?: RequestOrigin
  attachments: readonly RequestAttachment[]
  timeline: readonly RequestTimelineEntry[]
  /** A conversa entre titular e equipe, na ordem em que foi escrita. */
  messages: readonly RequestMessage[]
  answer?: RequestAnswer
  /** A resposta à pesquisa de satisfação (RF011), quando houver. */
  survey?: SurveyAnswer
}

/** O que o formulário do titular envia para abrir uma requisição (RF004). */
export interface NewRequest {
  rightNumeral: string
  /** Obrigatório quando o direito é o acesso aos dados. */
  accessFormat?: AccessFormat
  description: string
  attachments: readonly RequestAttachment[]
}

/** Comprovante devolvido pelo registro: é o que a tela de confirmação mostra. */
export interface RequestReceipt {
  protocol: string
  id: string
  rightNumeral: string
  registeredAt: string
  dueAt: string
  /** Resposta em até 24 horas, em vez dos 15 dias. */
  immediate: boolean
  attachmentCount: number
}

/** O que o formulário da encarregada envia para registrar em nome do titular. */
export interface OnBehalfRequest extends NewRequest {
  /** E-mail da conta do titular — o servidor exige conta ativa e confirmada. */
  subjectEmail: string
  /** A caixa de verificação de identidade — sem ela não há registro. */
  identityVerified: boolean
  channel: OriginChannel | null
  reference?: string
}

/** O comprovante do registro por terceiro. */
export interface OnBehalfReceipt extends RequestReceipt {
  subjectEmail: string
  origin: RequestOrigin
}
