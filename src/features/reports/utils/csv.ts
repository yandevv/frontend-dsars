import { REQUEST_STATUS_LABELS } from '@/features/requests/constants/requestStatus'
import { findRight } from '@/shared/constants/lgpdRights'
import type { ReportIndicator, ReportRecord } from '@/features/reports/types/report'

function cell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

function toCsv(header: readonly string[], rows: readonly (readonly string[])[]): string {
  return [header, ...rows].map((row) => row.map(cell).join(';')).join('\r\n')
}

/** Uma linha por indicador, para cruzar com outras bases. */
export function indicatorsToCsv(indicators: readonly ReportIndicator[], scope: string): string {
  return toCsv(
    ['Indicador', 'Valor', 'Unidade', 'Observação', 'Recorte'],
    indicators.map((indicator) => [
      indicator.label,
      indicator.value,
      indicator.unit,
      indicator.note,
      scope,
    ]),
  )
}

/**
 * Uma linha por requisição, sem nada que identifique alguém.
 *
 * É a exportação que auditoria externa costuma pedir, e mesmo ela sai
 * anonimizada: sem protocolo, sem titular, e com a data reduzida ao mês — dia
 * exato mais direito exercido já bastariam para reencontrar uma pessoa.
 */
export function recordsToCsv(records: readonly ReportRecord[]): string {
  return toCsv(
    ['Mês de registro', 'Direito exercido', 'Inciso', 'Estado', 'Dias até a resposta', 'Nota'],
    records.map((record) => [
      record.registeredAt.slice(0, 7),
      findRight(record.rightNumeral)?.requestLabel ?? record.rightNumeral,
      `art. 18, ${record.rightNumeral}`,
      REQUEST_STATUS_LABELS[record.status],
      record.daysToAnswer === undefined ? '' : String(record.daysToAnswer),
      record.rating === undefined ? '' : String(record.rating),
    ]),
  )
}
