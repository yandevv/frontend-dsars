import { describe, it, expect, afterEach, vi } from 'vitest'

import { http, onSessionExpired } from '../http'
import { ApiError } from '../ApiError'
import { mockApi, problem, route } from '@/test/api'

afterEach(() => {
  document.cookie = 'csrf_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
})

describe('http', () => {
  it('envia os cookies e devolve o JSON da resposta', async () => {
    const { fetchMock } = mockApi([route('GET', '/me', { id: 'conta-1' })])

    await expect(http.get('/me')).resolves.toEqual({ id: 'conta-1' })
    expect(fetchMock.mock.calls[0]![1]).toMatchObject({ credentials: 'include' })
  })

  it('monta a query repetindo o parâmetro das listas e ignorando vazios', async () => {
    const { calls } = mockApi([route('GET', '/me/requests', { items: [] })])

    await http.get('/me/requests', { query: { status: ['OPEN', 'COMPLETED'], page: 2, sort: '' } })

    expect(calls[0]!.query.getAll('status')).toEqual(['OPEN', 'COMPLETED'])
    expect(calls[0]!.query.get('page')).toBe('2')
    expect(calls[0]!.query.has('sort')).toBe(false)
  })

  it('devolve o cookie de CSRF no cabeçalho das escritas, e só nelas', async () => {
    document.cookie = 'csrf_token=segredo-123; path=/'
    const { calls } = mockApi([
      route('GET', '/me', {}),
      route('PATCH', '/me', {}),
    ])

    await http.get('/me')
    await http.patch('/me', { fullName: 'Marina' })

    expect(calls[0]!.headers['X-CSRF-Token']).toBeUndefined()
    expect(calls[1]!.headers['X-CSRF-Token']).toBe('segredo-123')
    expect(calls[1]!.body).toEqual({ fullName: 'Marina' })
  })

  it('traduz a recusa problem+json num ApiError com o texto do servidor', async () => {
    mockApi([
      route('POST', '/auth/register', {
        status: 400,
        body: {
          status: 400,
          detail: 'Revise os campos.',
          errors: [{ field: 'email', messages: ['Informe um endereço de e-mail válido.'] }],
        },
      }),
    ])

    const error = await http.post('/auth/register', {}).catch((failure: unknown) => failure)

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).detail).toBe('Revise os campos.')
    expect((error as ApiError).fieldErrors()).toEqual({
      email: 'Informe um endereço de e-mail válido.',
    })
  })

  it('renova a sessão uma vez e repete a chamada recusada com 401', async () => {
    let attempts = 0
    const { calls } = mockApi([
      route('GET', '/me/security', () => (++attempts === 1 ? problem(401, 'Vencido') : { ok: true })),
      route('POST', '/auth/refresh', { refreshed: true }),
    ])

    await expect(http.get('/me/security')).resolves.toEqual({ ok: true })
    expect(calls.map((call) => `${call.method} ${call.path}`)).toEqual([
      'GET /me/security',
      'POST /auth/refresh',
      'GET /me/security',
    ])
  })

  it('faz uma única renovação para várias chamadas vencidas ao mesmo tempo', async () => {
    const renewed = new Set<string>()
    const { calls } = mockApi([
      route(
        'GET',
        /^\/me\/(security|sessions)$/,
        (call) => (renewed.has(call.path) ? {} : (renewed.add(call.path), problem(401, 'Vencido'))),
      ),
      route('POST', '/auth/refresh', { refreshed: true }),
    ])

    await Promise.all([http.get('/me/security'), http.get('/me/sessions')])

    expect(calls.filter((call) => call.path === '/auth/refresh')).toHaveLength(1)
  })

  it('avisa que a sessão acabou quando a renovação falha', async () => {
    mockApi([
      route('GET', '/me/security', problem(401, 'Vencido')),
      route('POST', '/auth/refresh', problem(401, 'Sem sessão')),
    ])
    const listener = vi.fn<() => void>()
    const stop = onSessionExpired(listener)

    await expect(http.get('/me/security')).rejects.toMatchObject({ status: 401 })
    expect(listener).toHaveBeenCalledOnce()
    stop()
  })

  it('não tenta renovar nas rotas de autenticação', async () => {
    const { calls } = mockApi([route('POST', '/auth/login', problem(401, 'Não foi possível entrar.'))])

    await expect(http.post('/auth/login', {})).rejects.toMatchObject({
      detail: 'Não foi possível entrar.',
    })
    expect(calls).toHaveLength(1)
  })

  it('envia arquivos como multipart no campo files', async () => {
    const { calls } = mockApi([route('POST', '/requests/1/messages', { id: 'm1' })])
    const file = new File(['conteúdo'], 'documento.pdf', { type: 'application/pdf' })

    await http.upload('/requests/1/messages', { body: 'Segue', skip: undefined }, [file])

    expect(calls[0]!.body).toEqual({ fields: { body: ['Segue'] }, files: ['documento.pdf'] })
  })

  it('lê o nome do arquivo baixado do Content-Disposition', async () => {
    mockApi([
      route('GET', '/relatorio/export', {
        body: 'a;b',
        headers: { 'Content-Disposition': 'attachment; filename="relatorio-2026-09.csv"' },
      }),
    ])

    const file = await http.download('/relatorio/export', { format: 'csv' }, 'padrao.csv')

    expect(file.fileName).toBe('relatorio-2026-09.csv')
  })

  it('explica a falha de rede sem jargão', async () => {
    const error = await http.get('/me').catch((failure: unknown) => failure)

    expect((error as ApiError).status).toBe(0)
    expect((error as ApiError).detail).toMatch(/conexão/)
  })
})
