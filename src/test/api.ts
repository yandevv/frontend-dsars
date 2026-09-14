import { vi } from 'vitest'

/** Uma chamada que chegou ao `fetch` simulado. */
export interface ApiCall {
  method: string
  /** O caminho sem o prefixo `/api` e sem a query. */
  path: string
  query: URLSearchParams
  headers: Record<string, string>
  /** JSON já lido, ou, no envio com arquivos, os campos e os nomes dos arquivos. */
  body: unknown
}

export interface ApiReply {
  status?: number
  body?: unknown
  headers?: Record<string, string>
}

type Handler = (call: ApiCall) => ApiReply | unknown

export interface ApiRoute {
  method: string
  path: string | RegExp
  /** Uma função da chamada, um `ApiReply` ou o próprio corpo da resposta. */
  reply: unknown
}

function readBody(body: BodyInit | null | undefined): unknown {
  if (body instanceof FormData) {
    const fields: Record<string, string[]> = {}
    const files: string[] = []
    body.forEach((value, key) => {
      if (value instanceof File) files.push(value.name)
      else (fields[key] ??= []).push(value)
    })
    return { fields, files }
  }
  if (typeof body === 'string') return JSON.parse(body)
  return undefined
}

function isReply(value: unknown): value is ApiReply {
  return (
    typeof value === 'object' &&
    value !== null &&
    ('status' in value || 'body' in value) &&
    Object.keys(value).every((key) => ['status', 'body', 'headers'].includes(key))
  )
}

/**
 * Substitui o `fetch` por um servidor de mentira que responde por método e
 * caminho. Rota não prevista responde 404, como a API faria.
 */
export function mockApi(routes: ApiRoute[]) {
  const calls: ApiCall[] = []

  const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(
    async (input, init = {}) => {
    const url = new URL(String(input), 'http://localhost')
    const call: ApiCall = {
      method: (init.method ?? 'GET').toUpperCase(),
      path: url.pathname.replace(/^\/api/, ''),
      query: url.searchParams,
      headers: (init.headers as Record<string, string>) ?? {},
      body: readBody(init.body),
    }
    calls.push(call)

    const route = routes.find(
      (candidate) =>
        candidate.method === call.method &&
        (typeof candidate.path === 'string'
          ? candidate.path === call.path
          : candidate.path.test(call.path)),
    )

    if (!route) {
      return new Response(JSON.stringify({ status: 404, detail: 'Rota não simulada.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/problem+json' },
      })
    }

    const produced = typeof route.reply === 'function' ? (route.reply as Handler)(call) : route.reply
    const reply: ApiReply = isReply(produced) ? produced : { body: produced }
    const status = reply.status ?? 200
    const payload = status === 204 || reply.body === undefined ? null : JSON.stringify(reply.body)

    return new Response(payload, {
      status,
      headers: { 'Content-Type': 'application/json', ...reply.headers },
    })
    },
  )

  vi.stubGlobal('fetch', fetchMock)
  return { calls, fetchMock }
}

/** Atalho para as rotas: `route('GET', '/me', { ... })`. */
export function route(method: string, path: string | RegExp, reply: Handler): ApiRoute
export function route(method: string, path: string | RegExp, reply: unknown): ApiRoute
export function route(method: string, path: string | RegExp, reply: unknown): ApiRoute {
  return { method, path, reply }
}

/** Uma recusa no formato problem+json. */
export function problem(status: number, detail: string): ApiReply {
  return { status, body: { status, detail } }
}
