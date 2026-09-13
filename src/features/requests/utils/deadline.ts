import { DEADLINE_ALERT_DAYS } from '@/features/requests/constants/requestPolicy'
import { daysUntil } from '@/shared/utils/date'
import { isOpen } from '@/features/requests/constants/requestStatus'
import { requestIsImmediate } from '@/features/requests/utils/responseDeadline'
import type { DataRequest, DeadlineStatus } from '@/features/requests/types/request'

/**
 * Situação do prazo de uma requisição, sempre recalculada a partir de hoje.
 *
 * `now` é parâmetro para que os testes possam fixar o dia; nas telas ele nunca
 * é passado.
 */
export function deadlineStatusOf(request: DataRequest, now: Date = new Date()): DeadlineStatus {
  if (!isOpen(request.status)) return 'encerrada'

  // Prazo de horas: vence no minuto exato, e até lá está sempre perto do fim.
  if (requestIsImmediate(request)) return msLeft(request, now) < 0 ? 'vencida' : 'proxima'

  const remaining = daysUntil(request.dueAt, now)
  if (remaining < 0) return 'vencida'
  if (remaining <= DEADLINE_ALERT_DAYS) return 'proxima'
  return 'em-dia'
}

const HOUR_MS = 3_600_000

function msLeft(request: DataRequest, now: Date): number {
  return new Date(request.dueAt).getTime() - now.getTime()
}

/**
 * Dias que ainda restam — negativo quando o prazo já passou. No prazo de horas
 * sai fracionado, para que a fila ordene um pedido que vence em 3 horas antes
 * de um que vence amanhã.
 */
export function daysLeft(request: DataRequest, now: Date = new Date()): number {
  if (requestIsImmediate(request)) return msLeft(request, now) / (24 * HOUR_MS)
  return daysUntil(request.dueAt, now)
}

/** O prazo de horas em palavras: "Vence em 5 h", "Venceu há 2 h". */
function hoursLabel(request: DataRequest, now: Date): string {
  const left = msLeft(request, now)
  if (left >= 0) {
    const hours = Math.floor(left / HOUR_MS)
    return hours < 1 ? 'Vence em menos de 1 h' : `Vence em ${hours} h`
  }
  const late = Math.floor(-left / HOUR_MS)
  if (late < 1) return 'Venceu há menos de 1 h'
  if (late < 24) return `Venceu há ${late} h`
  const days = Math.floor(late / 24)
  return days === 1 ? 'Venceu há 1 dia' : `Venceu há ${days} dias`
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
  if (requestIsImmediate(request)) return hoursLabel(request, now)

  const remaining = daysLeft(request, now)
  if (remaining < 0) {
    const late = Math.abs(remaining)
    return late === 1 ? 'Venceu ontem' : `Venceu há ${late} dias`
  }
  if (remaining === 0) return 'Vence hoje'
  return remaining === 1 ? 'Falta 1 dia' : `Faltam ${remaining} dias`
}
