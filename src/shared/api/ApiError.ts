/** Um campo recusado pela validação do servidor. */
export interface FieldError {
  field: string
  messages: string[]
}

/** O corpo `application/problem+json` que a API devolve em toda recusa. */
export interface ProblemDetails {
  type?: string
  title?: string
  status?: number
  detail?: string
  instance?: string
  traceId?: string
  errors?: FieldError[]
}

const FALLBACK_DETAIL = 'Não foi possível concluir agora. Tente novamente em alguns instantes.'
const OFFLINE_DETAIL = 'Não conseguimos falar com o servidor. Confira sua conexão e tente de novo.'

/**
 * Recusa da API, já traduzida para o que a tela precisa.
 *
 * O `detail` vem do servidor em português e pode ir direto à tela: é escrito
 * para o usuário final, sem código nem termo técnico.
 */
export class ApiError extends Error {
  readonly status: number
  readonly title: string
  readonly detail: string
  readonly errors: readonly FieldError[]
  readonly traceId?: string

  constructor(status: number, problem: ProblemDetails = {}) {
    const detail = problem.detail?.trim() || (status === 0 ? OFFLINE_DETAIL : FALLBACK_DETAIL)
    super(detail)
    this.name = 'ApiError'
    this.status = status
    this.title = problem.title ?? ''
    this.detail = detail
    this.errors = problem.errors ?? []
    this.traceId = problem.traceId
  }

  /** A primeira recusa de cada campo, indexada pelo nome do campo. */
  fieldErrors(): Record<string, string> {
    return Object.fromEntries(
      this.errors.map((error) => [error.field, error.messages[0] ?? FALLBACK_DETAIL]),
    )
  }
}

export function isApiError(error: unknown, status?: number): error is ApiError {
  return error instanceof ApiError && (status === undefined || error.status === status)
}

/** A mensagem a mostrar para qualquer falha, venha ela da API ou não. */
export function messageOf(error: unknown): string {
  return error instanceof ApiError ? error.detail : FALLBACK_DETAIL
}
