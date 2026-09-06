import { delay } from '@/features/auth/services/fakeNetwork'
import { fetchRequest } from '@/features/requests/services/requestService'
import { SURVEY_COMMENT_MAX_LENGTH, SURVEY_RATINGS } from '@/features/survey/constants/surveyPolicy'
import type { DataRequest } from '@/features/requests/types/request'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ATENÇÃO — aqui entra a API da pesquisa de satisfação.
 *
 * Como em `requestService.ts`, as telas já conversam com esta função e as
 * recusas previstas nas regras estão todas aqui. Num servidor de verdade a
 * nota também seria gravada separada da requisição, para que ninguém consiga
 * ligá-la ao titular consultando a base.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Por que a pesquisa não pôde ser registrada. */
export type SurveyRefusal = 'nao-liberada' | 'ja-respondida' | 'nota-invalida' | 'comentario-longo'

export class SurveyError extends Error {
  constructor(readonly refusal: SurveyRefusal) {
    super(refusal)
    this.name = 'SurveyError'
  }
}

/** A pesquisa só existe para requisições concluídas — cancelada não gera pesquisa. */
export function surveyAvailable(request: DataRequest): boolean {
  return request.status === 'concluida'
}

/** Registra a avaliação do titular: uma única vez, e só depois da conclusão. */
export async function submitSurvey(
  id: string,
  { rating, comment }: { rating: number; comment?: string },
): Promise<DataRequest> {
  const request = await fetchRequest(id)
  await delay()

  if (!surveyAvailable(request)) throw new SurveyError('nao-liberada')
  if (request.survey) throw new SurveyError('ja-respondida')
  if (!SURVEY_RATINGS.some((option) => option.value === rating)) {
    throw new SurveyError('nota-invalida')
  }

  const text = comment?.trim() ?? ''
  if (text.length > SURVEY_COMMENT_MAX_LENGTH) throw new SurveyError('comentario-longo')

  const answeredAt = new Date().toISOString()
  request.survey = { rating, comment: text || undefined, answeredAt }
  // A trilha registra que houve resposta, nunca a nota: é a trilha que o
  // encarregado lê ao lado do nome do titular.
  request.timeline = [
    {
      at: answeredAt,
      title: 'Pesquisa de satisfação respondida',
      detail: 'A avaliação entra nos indicadores de qualidade sem identificar quem respondeu.',
      author: 'Titular',
      highlight: true,
    },
    ...request.timeline,
  ]

  return request
}
