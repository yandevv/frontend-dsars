import { describe, it, expect } from 'vitest'

import { submitSurvey, surveyAvailable } from '../surveyService'
import { mockApi, problem, route } from '@/test/api'
import { apiDetails, makeRequest } from '@/test/factories'

describe('surveyService', () => {
  it('só libera a pesquisa para requisições concluídas', () => {
    expect(surveyAvailable(makeRequest({ status: 'concluida' }))).toBe(true)
    expect(surveyAvailable(makeRequest({ status: 'aberta' }))).toBe(false)
    expect(surveyAvailable(makeRequest({ status: 'cancelada' }))).toBe(false)
  })

  it('envia a nota e o comentário sem espaços e relê a requisição', async () => {
    const { calls } = mockApi([
      route('POST', '/requests/r1/survey', { rating: 4, comment: 'Rápido.', respondedAt: '2026-09-26' }),
      route('GET', '/requests/r1', apiDetails({ id: 'r1', status: 'COMPLETED' })),
      route('GET', '/requests/r1/messages', { items: [] }),
      route('GET', '/requests/r1/survey', {
        available: true,
        answered: true,
        response: { rating: 4, comment: 'Rápido.', respondedAt: '2026-09-26T12:00:00.000Z' },
      }),
    ])

    const request = await submitSurvey('r1', { rating: 4, comment: '  Rápido.  ' })

    expect(calls[0]!.body).toEqual({ rating: 4, comment: 'Rápido.' })
    expect(request.survey).toMatchObject({ rating: 4, comment: 'Rápido.' })
  })

  it('não envia comentário vazio', async () => {
    const { calls } = mockApi([
      route('POST', '/requests/r1/survey', {}),
      route('GET', '/requests/r1', apiDetails({ id: 'r1' })),
      route('GET', '/requests/r1/messages', { items: [] }),
    ])

    await submitSurvey('r1', { rating: 5, comment: '   ' })

    expect(calls[0]!.body).toEqual({ rating: 5 })
  })

  it('repassa a recusa de uma segunda resposta', async () => {
    mockApi([
      route(
        'POST',
        '/requests/r1/survey',
        problem(409, 'A pesquisa de satisfação desta requisição já foi respondida.'),
      ),
    ])

    await expect(submitSurvey('r1', { rating: 5 })).rejects.toMatchObject({ status: 409 })
  })
})
