import { http, type DownloadedFile } from '@/shared/api/http'
import { organizationId } from '@/features/requests/services/requestService'
import type { ApiRequestReport, ApiRequestStatus, LgpdRight } from '@/shared/api/contracts'

/**
 * O relatório gerencial, apurado pelo servidor (RF028).
 *
 * Os números chegam agregados: a base inteira nunca atravessa a rede para que
 * alguém veja uma média, e o corte de anonimato da satisfação é aplicado lá.
 */

export interface ReportQuery {
  /** Primeiro e último dia do período, no formato AAAA-MM-DD. */
  from: string
  to: string
  status?: ApiRequestStatus[]
  right?: LgpdRight[]
}

function path(): string {
  return `/organizations/${organizationId()}/reports/requests`
}

export function fetchReport(query: ReportQuery): Promise<ApiRequestReport> {
  return http.get<ApiRequestReport>(path(), { query: { ...query } })
}

/** O mesmo recorte, em arquivo gerado pelo servidor — que registra a exportação. */
export function exportReport(query: ReportQuery, format: 'csv' | 'pdf'): Promise<DownloadedFile> {
  return http.download(
    `${path()}/export`,
    { ...query, format },
    `relatorio-gerencial.${format}`,
  )
}
