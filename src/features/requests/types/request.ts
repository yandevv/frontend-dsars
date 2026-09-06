/** Estados possíveis de uma requisição, como aparecem na fila e no relatório. */
export type RequestStatus =
  | 'em-analise'
  | 'aguardando-complemento'
  | 'concluida'
  | 'cancelada'

/** Desfecho de um atendimento encerrado pela encarregada (RF013). */
export type RequestOutcome = 'atendido' | 'parcialmente-atendido' | 'recusado'

/**
 * Situação do prazo legal, derivada da data de vencimento.
 *
 * É um dado calculado, nunca guardado: uma requisição gravada como "em dia"
 * continuaria em dia depois de vencer.
 */
export type DeadlineStatus = 'vencida' | 'proxima' | 'em-dia' | 'encerrada'

export interface RequestAttachment {
  name: string
  /** Linha de apoio já formatada — "PDF · 480 KB · enviado em 27/08/2026". */
  meta: string
}

/** Entrada da trilha de auditoria (RF006). */
export interface RequestTimelineEntry {
  at: string
  title: string
  detail: string
  author: string
  /** O que acabou de acontecer, destacado no alto do histórico. */
  highlight?: boolean
  /**
   * Trabalho interno da equipe — notas, consultas a outras áreas, distribuição.
   * Entra na trilha de auditoria, mas não aparece no histórico do titular.
   */
  internal?: boolean
}

/** Anotação que fica fora da resposta e não é visível ao titular. */
export interface InternalNote {
  text: string
  author: string
  at: string
}

/** Quem abriu a requisição, do ponto de vista de quem vai atendê-la. */
export interface RequestSubject {
  name: string
  email: string
  /** Documento parcialmente oculto, como o design o exibe. */
  document?: string
  /** Desde quando tem conta no portal — "2019". */
  customerSince?: string
  /** Quando a identidade foi conferida; ausente enquanto não foi. */
  verifiedAt?: string
}

/** Quem escreveu uma mensagem, pelo papel que ocupa na requisição. */
export type MessageAuthorRole = 'titular' | 'encarregado'

/**
 * O que a mensagem representa na conversa.
 *
 * `complemento` é o pedido de informação que põe a requisição em espera do
 * titular; `parecer` é a resposta conclusiva que encerra o atendimento.
 */
export type MessageKind = 'mensagem' | 'complemento' | 'parecer'

/** Quem está agindo sobre a conversa: o nome identifica, o papel autoriza. */
export interface MessageActor {
  name: string
  role: MessageAuthorRole
}

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
  /** Excluída some da conversa, mas continua registrada na trilha de auditoria. */
  deletedAt?: string
}

/** Resposta enviada ao titular ao encerrar o atendimento. */
export interface RequestAnswer {
  outcome: RequestOutcome
  text: string
  /** Obrigatório quando o desfecho é recusa: sem ele não há como sustentá-la. */
  legalBasis?: string
  /** O resultado entregue — relatório, comprovante, arquivo de portabilidade. */
  attachments?: readonly RequestAttachment[]
  sentAt: string
  author: string
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
  /** Identificador interno, usado em log e integração. */
  id: string
  rightNumeral: string
  description: string
  status: RequestStatus
  subject: RequestSubject
  registeredAt: string
  /** Vencimento do prazo do art. 19, contado do registro. */
  dueAt: string
  /** Quando saiu da fila — respondida ou cancelada pelo titular. */
  closedAt?: string
  /** Quem atende na organização; ausente enquanto ninguém assumiu. */
  assignee?: string
  channel: string
  unit?: string
  attachments: readonly RequestAttachment[]
  timeline: readonly RequestTimelineEntry[]
  notes: readonly InternalNote[]
  /** A conversa entre titular e equipe, na ordem em que foi escrita. */
  messages: readonly RequestMessage[]
  answer?: RequestAnswer
  /**
   * Nota de 1 a 5 da pesquisa de satisfação (RF011).
   *
   * Fica aqui porque é consequência do atendimento, mas o relatório gerencial
   * a lê sem o resto: lá ela entra sem vínculo com protocolo ou titular.
   */
  satisfactionRating?: number
}

/** O que o formulário do titular envia para abrir uma requisição (RF004). */
export interface NewRequest {
  rightNumeral: string
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
  attachmentCount: number
}
