import type {
  ApiDeadlineStatus,
  ApiRequestStatus,
  ApiResponseFormat,
  LgpdRight,
} from '@/shared/api/contracts'
import type { AccessFormat, DeadlineStatus, RequestStatus } from '@/features/requests/types/request'

/**
 * Tradução dos enums da API para o vocabulário da interface, nos dois sentidos.
 *
 * A interface guarda o direito pelo numeral do inciso (I a IX); a API, por um
 * nome estável em inglês. A ordem abaixo é a dos incisos do art. 18.
 */
const RIGHTS_IN_ORDER: readonly LgpdRight[] = [
  'PROCESSING_CONFIRMATION',
  'DATA_ACCESS',
  'DATA_CORRECTION',
  'ANONYMIZATION_BLOCKING_OR_DELETION',
  'DATA_PORTABILITY',
  'CONSENTED_DATA_DELETION',
  'SHARING_DISCLOSURE',
  'CONSENT_REFUSAL_CONSEQUENCES',
  'CONSENT_REVOCATION',
]

const NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'] as const

export function numeralOf(right: LgpdRight): string {
  return NUMERALS[RIGHTS_IN_ORDER.indexOf(right)] ?? ''
}

export function rightOf(numeral: string): LgpdRight {
  const index = NUMERALS.indexOf(numeral as (typeof NUMERALS)[number])
  const right = RIGHTS_IN_ORDER[index]
  if (!right) throw new RangeError(`Inciso desconhecido: ${numeral}`)
  return right
}

const STATUS: Record<ApiRequestStatus, RequestStatus> = {
  OPEN: 'aberta',
  COMPLETED: 'concluida',
  CANCELLED: 'cancelada',
}

export function statusOf(status: ApiRequestStatus): RequestStatus {
  return STATUS[status]
}

export function apiStatusOf(status: RequestStatus): ApiRequestStatus {
  const entry = Object.entries(STATUS).find(([, value]) => value === status)
  return (entry?.[0] ?? 'OPEN') as ApiRequestStatus
}

const DEADLINE: Record<ApiDeadlineStatus, DeadlineStatus> = {
  OVERDUE: 'vencida',
  DUE_SOON: 'proxima',
  ON_TIME: 'em-dia',
  CLOSED: 'encerrada',
}

export function deadlineOf(status: ApiDeadlineStatus): DeadlineStatus {
  return DEADLINE[status]
}

export function apiDeadlineOf(status: DeadlineStatus): ApiDeadlineStatus {
  const entry = Object.entries(DEADLINE).find(([, value]) => value === status)
  return (entry?.[0] ?? 'ON_TIME') as ApiDeadlineStatus
}

export function formatOf(format: ApiResponseFormat): AccessFormat {
  return format === 'SIMPLIFIED' ? 'simplificado' : 'completo'
}

export function apiFormatOf(format: AccessFormat): ApiResponseFormat {
  return format === 'simplificado' ? 'SIMPLIFIED' : 'COMPLETE'
}
