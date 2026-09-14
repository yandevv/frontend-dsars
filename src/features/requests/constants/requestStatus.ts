import type { RequestStatus } from '@/features/requests/types/request'

/** Como cada estado é escrito e pintado, nas cores das etiquetas do design. */
export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  aberta: 'Em aberto',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
}

export const REQUEST_STATUS_CLASSES: Record<RequestStatus, string> = {
  aberta: 'border-brand-line bg-brand-wash text-brand',
  concluida: 'border-line bg-field-disabled text-ink-soft',
  cancelada: 'border-line bg-field-disabled text-ink-soft',
}

/** Ordem de exibição nos filtros. */
export const REQUEST_STATUSES: readonly RequestStatus[] = ['aberta', 'concluida', 'cancelada']

/** Uma requisição em aberto é a que ainda consome prazo legal. */
export function isOpen(status: RequestStatus): boolean {
  return status === 'aberta'
}
