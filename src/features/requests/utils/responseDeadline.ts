import {
  IMMEDIATE_DEADLINE_HOURS,
  LEGAL_DEADLINE_DAYS,
} from '@/features/requests/constants/requestPolicy'
import { addDays, addHours, formatDate, formatDateTime } from '@/shared/utils/date'
import type { AccessFormat, DataRequest } from '@/features/requests/types/request'

/**
 * O prazo de resposta de cada pedido (RN015 / RN019).
 *
 * Imediato — 24 horas — para a confirmação de tratamento e para o acesso em
 * formato simplificado; até 15 dias para a declaração completa e, por política
 * da organização, para os demais direitos, que a lei não fixa em dias.
 */
export function isImmediate(rightNumeral: string, accessFormat?: AccessFormat): boolean {
  return rightNumeral === 'I' || (rightNumeral === 'II' && accessFormat === 'simplificado')
}

/** O pedido já registrado, pelo mesmo critério. */
export function requestIsImmediate(request: Pick<DataRequest, 'rightNumeral' | 'accessFormat'>) {
  return isImmediate(request.rightNumeral, request.accessFormat)
}

/** O vencimento a partir do momento em que o prazo começa a contar. */
export function dueAtFor(from: string, rightNumeral: string, accessFormat?: AccessFormat): string {
  return deadlineFrom(from, isImmediate(rightNumeral, accessFormat))
}

/** 24 horas ou 15 dias depois de `from`. */
export function deadlineFrom(from: string, immediate: boolean): string {
  return immediate ? addHours(from, IMMEDIATE_DEADLINE_HOURS) : addDays(from, LEGAL_DEADLINE_DAYS)
}

/** O prazo em palavras: "Em até 24 horas" ou "15 dias". */
export function deadlinePhrase(immediate: boolean): string {
  return immediate ? `Em até ${IMMEDIATE_DEADLINE_HOURS} horas` : `${LEGAL_DEADLINE_DAYS} dias`
}

/**
 * O vencimento como a tela o escreve. No prazo de horas a hora importa —
 * "27/09/2026, 14:05" —; no de dias, a data basta.
 */
export function formatDue(dueAt: string, immediate: boolean): string {
  return immediate ? formatDateTime(dueAt) : formatDate(dueAt)
}

/** O acesso aos dados precisa do formato antes de ter prazo. */
export function needsAccessFormat(rightNumeral: string): boolean {
  return rightNumeral === 'II'
}

export const ACCESS_FORMATS: readonly {
  value: AccessFormat
  label: string
  summary: string
}[] = [
  {
    value: 'simplificado',
    label: 'Formato simplificado',
    summary: `Os dados que a organização tem sobre você, sem detalhes de origem. Resposta em até ${IMMEDIATE_DEADLINE_HOURS} horas.`,
  },
  {
    value: 'completo',
    label: 'Declaração completa',
    summary: `Os dados, de onde vieram, para que servem e com quem foram compartilhados. Até ${LEGAL_DEADLINE_DAYS} dias.`,
  },
]
