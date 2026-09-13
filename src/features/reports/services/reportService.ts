import { DEMO_HISTORY } from '@/features/reports/data/history'
import { daysUntil } from '@/shared/utils/date'
import { delay } from '@/features/auth/services/fakeNetwork'
import { listRequests } from '@/features/requests/services/requestService'
import type { DataRequest } from '@/features/requests/types/request'
import type { ReportRecord } from '@/features/reports/types/report'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ATENÇÃO — aqui entra a apuração do relatório.
 *
 * Num sistema com servidor estes números vêm agregados de lá, e não montados no
 * navegador: a base inteira nunca precisa atravessar a rede para que alguém veja
 * uma média. Trocar o corpo desta função é o que faz essa mudança, sem tocar na
 * tela.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** A requisição vista pelo relatório: só o que entra em conta. */
function toRecord(request: DataRequest): ReportRecord {
  return {
    registeredAt: request.registeredAt,
    rightNumeral: request.rightNumeral,
    status: request.status,
    daysToAnswer:
      request.status === 'concluida' && request.closedAt
        ? Math.max(0, daysUntil(request.closedAt, new Date(request.registeredAt)))
        : undefined,
    rating: request.survey?.rating,
    onTime:
      request.status === 'concluida' && request.closedAt
        ? request.closedAt <= request.dueAt
        : undefined,
  }
}

/**
 * Os atendimentos que o relatório agrega.
 *
 * A fila viva entra junto com o histórico para que os dois lados do sistema
 * contem a mesma coisa: uma requisição finalizada agora aparece no relatório na
 * recarga seguinte.
 */
export async function fetchReportRecords(): Promise<readonly ReportRecord[]> {
  await delay()
  const queue = await listRequests()
  return [...queue.map(toRecord), ...DEMO_HISTORY]
}
