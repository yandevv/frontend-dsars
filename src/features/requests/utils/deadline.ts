import { DEADLINE_ALERT_DAYS } from '@/features/requests/constants/requestPolicy'
import { daysUntil } from '@/shared/utils/date'
import { isOpen } from '@/features/requests/constants/requestStatus'
import type { DataRequest, DeadlineStatus } from '@/features/requests/types/request'

/**
 * Situação do prazo de uma requisição, sempre recalculada a partir de hoje.
 *
 * `now` é parâmetro para que os testes possam fixar o dia; nas telas ele nunca
 * é passado.
 */
export function deadlineStatusOf(request: DataRequest, now: Date = new Date()): DeadlineStatus {
  if (!isOpen(request.status)) return 'encerrada'

  const remaining = daysUntil(request.dueAt, now)
  if (remaining < 0) return 'vencida'
  if (remaining <= DEADLINE_ALERT_DAYS) return 'proxima'
  return 'em-dia'
}

/** Dias que ainda restam — negativo quando o prazo já passou. */
export function daysLeft(request: DataRequest, now: Date = new Date()): number {
  return daysUntil(request.dueAt, now)
}

/**
 * O prazo em linguagem corrente, do jeito que a fila o anuncia.
 *
 * A data absoluta nunca é substituída por isto: ela aparece logo abaixo, porque
 * é ela que vale no relatório à autoridade.
 */
export function deadlineLabel(request: DataRequest, now: Date = new Date()): string {
  if (request.status === 'concluida') return 'Respondida'
  if (request.status === 'cancelada') return 'Cancelada pelo titular'

  const remaining = daysLeft(request, now)
  if (remaining < 0) {
    const late = Math.abs(remaining)
    return late === 1 ? 'Venceu ontem' : `Venceu há ${late} dias`
  }
  if (remaining === 0) return 'Vence hoje'
  return remaining === 1 ? 'Falta 1 dia' : `Faltam ${remaining} dias`
}
