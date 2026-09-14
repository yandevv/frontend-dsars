import { http } from '@/shared/api/http'
import { fetchRequest } from '@/features/requests/services/requestService'
import type { DataRequest } from '@/features/requests/types/request'

/**
 * Pesquisa de satisfação (RF011).
 *
 * Uma resposta por requisição, só depois da conclusão e só pelo titular — o
 * servidor recusa o resto. A nota é gravada à parte da requisição, e o
 * relatório a lê sem protocolo nem titular.
 */

/** A pesquisa só existe para requisições concluídas — cancelada não gera pesquisa. */
export function surveyAvailable(request: DataRequest): boolean {
  return request.status === 'concluida'
}

/** Registra a avaliação e devolve a requisição relida, já com a resposta. */
export async function submitSurvey(
  id: string,
  { rating, comment }: { rating: number; comment?: string },
): Promise<DataRequest> {
  await http.post(`/requests/${id}/survey`, {
    rating,
    comment: comment?.trim() || undefined,
  })
  return fetchRequest(id)
}
