import { http } from '@/shared/api/http'
import { describeUserAgent } from '@/features/settings/utils/userAgent'
import type { ApiSecurityView, ApiSession } from '@/shared/api/contracts'
import type { AccountSession, SecurityOverview } from '@/features/settings/types/security'

/**
 * Senha e sessões da conta (RF018 / RF019).
 *
 * Trocar a senha encerra todas as outras sessões no servidor; só o aparelho
 * em que a troca foi feita continua conectado. Cada operação gera um aviso de
 * segurança por e-mail, também do lado do servidor.
 */

function toSession(session: ApiSession): AccountSession {
  return {
    id: session.id,
    device: describeUserAgent(session.userAgent),
    origin: session.ipAddress ?? 'Origem não registrada',
    startedAt: session.createdAt,
    lastSeenAt: session.lastUsedAt,
    current: session.current,
  }
}

export async function fetchSecurity(): Promise<SecurityOverview> {
  const view = await http.get<ApiSecurityView>('/me/security')
  return {
    passwordSet: view.passwordSet,
    passwordChangedAt: view.passwordChangedAt,
    // A sessão atual primeiro; as outras, da mais recente para a mais antiga.
    sessions: view.sessions
      .map(toSession)
      .sort((a, b) => Number(b.current) - Number(a.current) || b.lastSeenAt.localeCompare(a.lastSeenAt)),
  }
}

export async function changePassword({
  current,
  next,
}: {
  current?: string
  next: string
}): Promise<SecurityOverview & { endedSessions: number }> {
  const { revokedSessions } = await http.put<{ revokedSessions: number }>('/me/password', {
    currentPassword: current || undefined,
    password: next,
    passwordConfirmation: next,
  })
  return { ...(await fetchSecurity()), endedSessions: revokedSessions }
}

/** Encerra uma sessão de outro aparelho. A atual se encerra pelo "Sair". */
export async function endSession(sessionId: string): Promise<SecurityOverview> {
  await http.delete(`/me/sessions/${sessionId}`)
  return fetchSecurity()
}

export async function endOtherSessions(): Promise<SecurityOverview & { endedSessions: number }> {
  const { revokedSessions } = await http.delete<{ revokedSessions: number }>('/me/sessions')
  return { ...(await fetchSecurity()), endedSessions: revokedSessions }
}
