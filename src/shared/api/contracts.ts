/**
 * Os formatos que a API devolve, espelhando os DTOs do backend.
 *
 * Datas chegam como texto ISO 8601. Nenhum componente usa estes tipos direto:
 * os serviços de cada área os traduzem para os tipos da interface.
 */

export type LgpdRight =
  | 'PROCESSING_CONFIRMATION'
  | 'DATA_ACCESS'
  | 'DATA_CORRECTION'
  | 'ANONYMIZATION_BLOCKING_OR_DELETION'
  | 'DATA_PORTABILITY'
  | 'CONSENTED_DATA_DELETION'
  | 'SHARING_DISCLOSURE'
  | 'CONSENT_REFUSAL_CONSEQUENCES'
  | 'CONSENT_REVOCATION'

export type ApiRequestStatus = 'OPEN' | 'COMPLETED' | 'CANCELLED'
export type ApiDeadlineStatus = 'OVERDUE' | 'DUE_SOON' | 'ON_TIME' | 'CLOSED'
export type ApiResponseFormat = 'SIMPLIFIED' | 'COMPLETE'
export type ApiRequestChannel =
  | 'PLATFORM'
  | 'EMAIL'
  | 'PHONE'
  | 'IN_PERSON'
  | 'POSTAL_MAIL'
  | 'OTHER'
export type ApiRole = 'DATA_SUBJECT' | 'DPO'
export type ApiDocumentType = 'CPF' | 'RG' | 'CNH' | 'PASSPORT' | 'OTHER'
export type ApiNotificationChannel = 'IN_APP' | 'EMAIL'
export type ApiNotificationEvent =
  | 'REQUEST_REGISTERED'
  | 'REQUEST_MESSAGE_RECEIVED'
  | 'REQUEST_COMPLETED'
  | 'REQUEST_CANCELLED'
  | 'REQUEST_DEADLINE_APPROACHING'
  | 'REQUEST_DEADLINE_EXPIRED'
  | 'SATISFACTION_SURVEY_AVAILABLE'
  | 'ACCOUNT_SECURITY_ALERT'
  | 'DPO_INVITE_RECEIVED'

export interface Page<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
}

// ── Conta ───────────────────────────────────────────────────────────────────

export interface ApiMembership {
  organizationId: string
  organizationName: string
  role: string
}

export interface ApiProfile {
  id: string
  fullName: string
  email: string
  emailVerified: boolean
  memberships: ApiMembership[]
}

export interface ApiAccountView extends ApiProfile {
  passwordSet: boolean
  createdAt: string
  document: { type: ApiDocumentType; masked: string; verified: boolean } | null
  phone: { masked: string } | null
  pendingEmailChange: { newEmail: string; expiresAt: string } | null
}

export interface ApiRevealedPersonalData {
  document: { type: ApiDocumentType | null; value: string } | null
  phone: string | null
}

export interface ApiSession {
  id: string
  familyId: string
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  lastUsedAt: string
  expiresAt: string
  current: boolean
}

export interface ApiSecurityView {
  passwordSet: boolean
  passwordChangedAt: string | null
  sessions: ApiSession[]
}

export interface ApiPublicOrganization {
  slug: string
  name: string
  dpo: { name: string; email: string; phone: string | null }
  rightsGuidance: string
}

// ── Requisições ─────────────────────────────────────────────────────────────

export interface ApiAttachment {
  id: string
  kind: 'REQUEST_DOCUMENT' | 'MESSAGE_DOCUMENT' | 'OUTCOME_DOCUMENT'
  fileName: string
  contentType: string
  sizeBytes: number
  createdAt: string
}

export interface ApiOrganizationRef {
  id: string
  name: string
  slug: string
}

export interface ApiRequestSummary {
  id: string
  protocolNumber: string
  organization: ApiOrganizationRef
  dataSubject: { id: string; fullName: string } | null
  rights: LgpdRight[]
  status: ApiRequestStatus
  registeredAt: string
  dueAt: string
  closedAt: string | null
  deadlineStatus: ApiDeadlineStatus
}

export interface ApiRequestDetails {
  id: string
  protocolNumber: string
  organization: ApiOrganizationRef
  dataSubject: { id: string; fullName: string; email: string } | null
  registeredOnBehalf: boolean
  rights: LgpdRight[]
  responseFormat: ApiResponseFormat
  description: string
  channel: ApiRequestChannel
  channelDetails: string | null
  status: ApiRequestStatus
  registeredAt: string
  dueAt: string
  deadlineStatus: ApiDeadlineStatus
  remainingSeconds: number | null
  closedAt: string | null
  cancellationReason: string | null
  attachments: ApiAttachment[]
  viewerRoles: ApiRole[]
}

export interface ApiRegisteredRequest {
  id: string
  protocolNumber: string
  rights: LgpdRight[]
  responseFormat: ApiResponseFormat
  status: ApiRequestStatus
  registeredAt: string
  dueAt: string
  deadlineStatus: ApiDeadlineStatus
  attachments: ApiAttachment[]
}

export interface ApiClosedRequest {
  id: string
  protocolNumber: string
  status: ApiRequestStatus
  closedAt: string
  dueAt: string
  onTime: boolean
}

export interface ApiBulkCancellation {
  cancelled: ApiClosedRequest[]
  rejected: { id: string; protocolNumber?: string; reason: 'NOT_FOUND' | 'NOT_ALLOWED' | 'NOT_OPEN' }[]
}

export interface ApiMessage {
  id: string
  body: string | null
  author: { id: string; fullName: string; role: ApiRole }
  mine: boolean
  isConclusive: boolean
  edited: boolean
  editedAt: string | null
  editableUntil: string | null
  createdAt: string
  attachments: ApiAttachment[]
}

export interface ApiDownloadLink {
  url: string
  expiresAt?: string
  fileName: string
}

export interface ApiSurveyState {
  available: boolean
  answered: boolean
  response: { rating: number; comment: string | null; respondedAt: string } | null
}

// ── Notificações ────────────────────────────────────────────────────────────

export interface ApiNotification {
  id: string
  eventType: ApiNotificationEvent
  title: string
  body: string
  resourceType: string | null
  resourceId: string | null
  read: boolean
  readAt: string | null
  createdAt: string
}

export interface ApiNotificationTarget {
  resourceType: string | null
  resourceId: string | null
  path: string | null
}

export interface ApiEventPreference {
  eventType: ApiNotificationEvent
  label: string
  description: string
  channels: { channel: ApiNotificationChannel; enabled: boolean; mandatory: boolean }[]
}

// ── Relatório ───────────────────────────────────────────────────────────────

export interface ApiRequestReport {
  organizationId: string
  period: { from: string; to: string }
  filters: { status: ApiRequestStatus[] | null; right: LgpdRight[] | null }
  generatedAt: string
  total: number
  totalsByStatus: Record<ApiRequestStatus, number>
  totalsByRight: Partial<Record<LgpdRight, number>>
  averageResolutionHours: number | null
  deadline: {
    closed: number
    closedOnTime: number
    onTimePercentage: number | null
    openOverdue: number
  }
  satisfaction: {
    responses: number
    suppressed: boolean
    averageRating: number | null
    distribution: Record<'1' | '2' | '3' | '4' | '5', number> | null
  }
}

// ── Convites ────────────────────────────────────────────────────────────────

export interface ApiInvitePreview {
  organizationName: string
  email: string
  role: string
  expiresAt: string
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED'
}

export interface ApiAcceptedInvite {
  organizationId: string
  organizationName: string
  role: string
}
