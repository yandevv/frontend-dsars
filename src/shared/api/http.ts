import { ApiError, type ProblemDetails } from '@/shared/api/ApiError'

/**
 * Cliente HTTP da API.
 *
 * A sessão mora em cookies `httpOnly` que o JavaScript não lê: o navegador os
 * envia sozinho, por isso toda chamada sai com `credentials: 'include'`. O que
 * o JavaScript lê é o `csrf_token`, devolvido no cabeçalho `X-CSRF-Token` a
 * cada escrita — é assim que o servidor confere que a escrita partiu desta
 * aplicação, e não de uma página alheia aproveitando os cookies.
 *
 * O token de acesso vale poucos minutos. Quando ele vence, a primeira chamada
 * recusada com 401 dispara uma única renovação, e todas as que chegarem
 * enquanto ela corre esperam por ela antes de tentar de novo.
 */

const CSRF_COOKIE = 'csrf_token'
const CSRF_HEADER = 'X-CSRF-Token'
const REFRESH_PATH = '/auth/refresh'
const SAFE_METHODS = new Set(['GET', 'HEAD'])

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/** Valor aceito na query: listas viram o mesmo parâmetro repetido. */
export type QueryValue = string | number | boolean | null | undefined | readonly (string | number)[]

export interface RequestOptions {
  query?: Record<string, QueryValue>
  body?: unknown
  /** Arquivos enviados como `multipart/form-data`, no campo `files`. */
  files?: readonly File[]
  signal?: AbortSignal
}

export function apiBase(): string {
  return (import.meta.env.VITE_API_BASE ?? '/api').replace(/\/$/, '')
}

export function apiUrl(path: string, query?: Record<string, QueryValue>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === '') continue
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, String(item))
    } else {
      params.append(key, String(value))
    }
  }
  const search = params.toString()
  return `${apiBase()}${path}${search ? `?${search}` : ''}`
}

function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  const entry = document.cookie.split('; ').find((cookie) => cookie.startsWith(`${name}=`))
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : undefined
}

// ── Sessão expirada ─────────────────────────────────────────────────────────

type ExpiredListener = () => void
const expiredListeners = new Set<ExpiredListener>()

/** Avisa quando a renovação falhou: a sessão acabou e é preciso entrar de novo. */
export function onSessionExpired(listener: ExpiredListener): () => void {
  expiredListeners.add(listener)
  return () => expiredListeners.delete(listener)
}

let refreshing: Promise<boolean> | null = null

/** Uma renovação por vez, compartilhada por quem chegar enquanto ela corre. */
function refreshSession(): Promise<boolean> {
  refreshing ??= fetch(apiUrl(REFRESH_PATH), { method: 'POST', credentials: 'include' })
    .then((response) => response.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null
    })
  return refreshing
}

// ── Envio ───────────────────────────────────────────────────────────────────

function buildInit(method: HttpMethod, options: RequestOptions): RequestInit {
  const headers: Record<string, string> = { Accept: 'application/json' }
  let body: BodyInit | undefined

  if (options.files) {
    const form = new FormData()
    for (const [key, value] of Object.entries((options.body ?? {}) as Record<string, unknown>)) {
      if (value === undefined || value === null) continue
      if (Array.isArray(value)) {
        for (const item of value) form.append(key, String(item))
      } else {
        form.append(key, String(value))
      }
    }
    for (const file of options.files) form.append('files', file, file.name)
    body = form
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(options.body)
  }

  if (!SAFE_METHODS.has(method)) {
    const csrf = readCookie(CSRF_COOKIE)
    if (csrf) headers[CSRF_HEADER] = csrf
  }

  return { method, headers, body, credentials: 'include', signal: options.signal }
}

async function problemOf(response: Response): Promise<ProblemDetails> {
  try {
    return (await response.json()) as ProblemDetails
  } catch {
    return {}
  }
}

async function send(method: HttpMethod, path: string, options: RequestOptions): Promise<Response> {
  const url = apiUrl(path, options.query)
  let response: Response

  try {
    response = await fetch(url, buildInit(method, options))
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(0)
  }

  // As rotas de autenticação respondem 401 por credencial errada, não por
  // sessão vencida: renovar ali não faria sentido.
  if (response.status === 401 && !path.startsWith('/auth/')) {
    if (await refreshSession()) {
      // O cookie de CSRF muda com a renovação: a nova tentativa relê o valor.
      response = await fetch(url, buildInit(method, options))
    }
    if (response.status === 401) {
      for (const listener of expiredListeners) listener()
    }
  }

  if (!response.ok) throw new ApiError(response.status, await problemOf(response))
  return response
}

async function json<T>(method: HttpMethod, path: string, options: RequestOptions = {}): Promise<T> {
  const response = await send(method, path, options)
  if (response.status === 204) return undefined as T
  const text = await response.text()
  return (text ? JSON.parse(text) : undefined) as T
}

export interface DownloadedFile {
  blob: Blob
  fileName: string
}

function fileNameOf(response: Response, fallback: string): string {
  const disposition = response.headers.get('Content-Disposition') ?? ''
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(disposition)?.[1]
  if (encoded) return decodeURIComponent(encoded)
  return /filename="?([^";]+)"?/i.exec(disposition)?.[1] ?? fallback
}

export const http = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'body' | 'files'>) =>
    json<T>('GET', path, options),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'body'>) =>
    json<T>('POST', path, { ...options, body }),
  put: <T>(path: string, body?: unknown) => json<T>('PUT', path, { body }),
  patch: <T>(path: string, body?: unknown) => json<T>('PATCH', path, { body }),
  delete: <T = void>(path: string) => json<T>('DELETE', path),
  /** `multipart/form-data`: os campos de `body` mais os arquivos em `files`. */
  upload: <T>(path: string, body: Record<string, unknown>, files: readonly File[]) =>
    json<T>('POST', path, { body, files }),
  /** Arquivo gerado pelo servidor, com o nome do `Content-Disposition`. */
  async download(
    path: string,
    query: Record<string, QueryValue>,
    fallbackName: string,
  ): Promise<DownloadedFile> {
    const response = await send('GET', path, { query })
    return { blob: await response.blob(), fileName: fileNameOf(response, fallbackName) }
  },
}
