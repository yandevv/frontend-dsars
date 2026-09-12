import { AUDIT_OPERATION_LABELS } from '@/features/audit/constants/auditOperations'
import { formatDateTime } from '@/shared/utils/date'
import type { AuditEntry } from '@/features/audit/types/audit'

const COLUMNS = ['Quando', 'Quem', 'Perfil', 'Operação', 'Ação', 'Detalhe', 'Recurso', 'Origem']

/** Escapa segundo o RFC 4180: aspas dobradas e campo entre aspas. */
function cell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}

/**
 * A trilha recortada, em CSV — o que está na tela, com o separador que o
 * Excel em português espera. É o arquivo que acompanha uma resposta à ANPD.
 */
export function auditToCsv(entries: readonly AuditEntry[]): string {
  const rows = entries.map((entry) =>
    [
      formatDateTime(entry.at),
      entry.actor,
      entry.actorRole === 'titular' ? 'Titular' : 'Encarregado',
      AUDIT_OPERATION_LABELS[entry.operation],
      entry.action,
      entry.detail,
      entry.resource.label,
      entry.origin,
    ]
      .map(cell)
      .join(';'),
  )
  return [COLUMNS.map(cell).join(';'), ...rows].join('\r\n')
}
