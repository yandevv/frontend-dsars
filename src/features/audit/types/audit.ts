import type { AccountRole } from '@/features/auth/types/auth'

/**
 * O tipo de operação, no vocabulário da prestação de contas: criação,
 * alteração, transição de estado e acesso a dados pessoais (RN083), mais o que
 * a organização precisa mostrar à parte — exportações e tentativas negadas.
 */
export type AuditOperation =
  | 'criacao'
  | 'transicao'
  | 'alteracao'
  | 'acesso'
  | 'exportacao'
  | 'seguranca'
  | 'negado'

/** Sobre o que a operação agiu. */
export interface AuditResource {
  kind: 'requisicao' | 'conta' | 'relatorio' | 'fila' | 'auditoria' | 'area-restrita'
  /** Como a tela escreve o recurso — o protocolo, "Conta de Marina…". */
  label: string
  /** Presente nas requisições: a trilha leva à página delas. */
  requestId?: string
}

/**
 * Um registro da trilha de auditoria.
 *
 * Não há campo de edição nem de exclusão, e o serviço não oferece nenhuma das
 * duas operações: a trilha só cresce (RN084).
 */
export interface AuditEntry {
  id: string
  at: string
  actor: string
  actorRole: AccountRole
  operation: AuditOperation
  action: string
  detail: string
  resource: AuditResource
  /** De onde partiu: o portal do titular, a área do encarregado, o endereço. */
  origin: string
}

export type NewAuditEntry = Omit<AuditEntry, 'id' | 'at'>
