import type { DeadlineStatus } from '@/features/requests/types/request'

/**
 * Como a fila pinta cada situação de prazo.
 *
 * A urgência aparece em três sinais ao mesmo tempo — filete à esquerda, fundo e
 * peso do texto —, e nunca só na cor: quem não distingue vermelho de laranja
 * continua vendo a linha mais pesada e lendo "Venceu há 2 dias".
 */
export const DEADLINE_ROW_CLASSES: Record<DeadlineStatus, string> = {
  vencida: 'border-l-danger bg-danger-wash',
  proxima: 'border-l-due-soon bg-due-soon-wash',
  'em-dia': 'border-l-transparent bg-surface',
  encerrada: 'border-l-transparent bg-surface-subtle',
}

export const DEADLINE_TEXT_CLASSES: Record<DeadlineStatus, string> = {
  vencida: 'font-bold text-danger',
  proxima: 'font-bold text-due-soon-ink',
  'em-dia': 'text-ink-body',
  encerrada: 'text-ink-muted',
}
