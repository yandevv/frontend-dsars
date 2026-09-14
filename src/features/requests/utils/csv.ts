import { REQUEST_STATUS_LABELS } from '@/features/requests/constants/requestStatus'
import { deadlineLabel } from '@/features/requests/utils/deadline'
import { findRight } from '@/shared/constants/lgpdRights'
import { formatDate } from '@/shared/utils/date'
import { formatDue, requestIsImmediate } from '@/features/requests/utils/responseDeadline'
import type { DataRequest } from '@/features/requests/types/request'

const COLUMNS = [
  'Protocolo',
  'Direito exercido',
  'Inciso',
  'Titular',
  'Estado',
  'Registrada em',
  'Prazo legal',
  'Situação do prazo',
] as const

/** Escapa segundo o RFC 4180: aspas dobradas e campo entre aspas. */
function cell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

/**
 * A fila recortada, em CSV.
 *
 * Sai com os filtros aplicados, e não com a fila inteira: quem exporta está
 * levando embora o que está vendo. O separador é o ponto e vírgula porque é o
 * que o Excel em português espera.
 */
export function queueToCsv(requests: readonly DataRequest[]): string {
  const rows = requests.map((request) =>
    [
      request.protocol,
      findRight(request.rightNumeral)?.requestLabel ?? request.rightNumeral,
      request.rightNumeral,
      request.subject.name,
      REQUEST_STATUS_LABELS[request.status],
      formatDate(request.registeredAt),
      formatDue(request.dueAt, requestIsImmediate(request)),
      deadlineLabel(request),
    ]
      .map(cell)
      .join(';'),
  )

  return [COLUMNS.map(cell).join(';'), ...rows].join('\r\n')
}
