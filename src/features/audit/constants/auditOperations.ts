import type { AuditOperation } from '@/features/audit/types/audit'

/** Como cada operação é escrita na trilha e nos filtros. */
export const AUDIT_OPERATION_LABELS: Record<AuditOperation, string> = {
  criacao: 'Criação',
  transicao: 'Mudança de estado',
  alteracao: 'Alteração',
  acesso: 'Acesso a dados pessoais',
  exportacao: 'Exportação',
  seguranca: 'Segurança da conta',
  negado: 'Acesso negado',
}

/** Ordem dos filtros: o ciclo da requisição primeiro, o que é da conta depois. */
export const AUDIT_OPERATIONS: readonly AuditOperation[] = [
  'criacao',
  'transicao',
  'alteracao',
  'acesso',
  'exportacao',
  'seguranca',
  'negado',
]

/**
 * O filete à esquerda de cada registro. Só o acesso negado chama atenção em
 * vermelho: o resto é rotina, e rotina não pode parecer alarme.
 */
export const AUDIT_OPERATION_STRIPES: Record<AuditOperation, string> = {
  criacao: 'bg-brand',
  transicao: 'bg-brand',
  alteracao: 'bg-field-disabled-line',
  acesso: 'bg-pending-line',
  exportacao: 'bg-ink-muted',
  seguranca: 'bg-ink-muted',
  negado: 'bg-danger',
}

/** Quanto tempo os registros ficam guardados, no mínimo (RN085). */
export const AUDIT_RETENTION_YEARS = 5
