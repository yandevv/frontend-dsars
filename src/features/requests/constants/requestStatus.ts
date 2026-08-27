import type { RequestOutcome, RequestStatus } from '@/features/requests/types/request'

/** Como cada estado é escrito e pintado, nas cores das etiquetas do design. */
export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  'em-analise': 'Em análise',
  'aguardando-complemento': 'Aguardando complemento',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
}

export const REQUEST_STATUS_CLASSES: Record<RequestStatus, string> = {
  'em-analise': 'border-brand-line bg-brand-wash text-brand',
  'aguardando-complemento': 'border-pending-line bg-pending-wash text-pending',
  concluida: 'border-line bg-field-disabled text-ink-soft',
  cancelada: 'border-line bg-field-disabled text-ink-soft',
}

/** Ordem de exibição nos filtros, a mesma dos seletores do design. */
export const REQUEST_STATUSES: readonly RequestStatus[] = [
  'em-analise',
  'aguardando-complemento',
  'concluida',
  'cancelada',
]

export const REQUEST_OUTCOME_LABELS: Record<RequestOutcome, string> = {
  atendido: 'Atendido',
  'parcialmente-atendido': 'Parcialmente atendido',
  recusado: 'Recusado',
}

/**
 * Uma requisição em aberto é a que ainda consome prazo legal.
 *
 * Aguardando complemento continua aberta de propósito: a contagem do art. 19
 * não para enquanto se espera o titular, e é a leitura conservadora que a
 * autoridade tende a adotar.
 */
export function isOpen(status: RequestStatus): boolean {
  return status === 'em-analise' || status === 'aguardando-complemento'
}
