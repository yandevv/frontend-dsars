import { TEAM_MEMBERS } from '@/features/team/data/members'
import { DEMO_INVITES } from '@/features/team/data/invites'
import { deadlineStatusOf } from '@/features/requests/utils/deadline'
import { isOpen } from '@/features/requests/constants/requestStatus'
import { organizationId } from '@/features/requests/services/requestService'
import { http } from '@/shared/api/http'
import type { Account } from '@/features/auth/types/auth'
import type { Invite } from '@/features/auth/types/invite'
import type { DataRequest } from '@/features/requests/types/request'
import type { InviteStatus, TeamMemberWorkload } from '@/features/team/types/team'

/**
 * A equipe e os convites.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ATENÇÃO — enviar um convite já vai à API. Listar pessoas e convites ainda
 * não: a API não oferece essas consultas, e até lá a lista é a de
 * demonstração, acrescida dos convites enviados nesta aba.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Quem pode o quê é decidido pelo servidor a cada chamada; esconder um botão
 * não é controle de acesso.
 */

export type TeamRule = 'email-invalido' | 'ja-e-membro'

export class TeamRuleError extends Error {
  constructor(readonly rule: TeamRule) {
    super(rule)
    this.name = 'TeamRuleError'
  }
}

type Actor = Pick<Account, 'name' | 'email'>

let invites: Invite[] = DEMO_INVITES.map((invite) => ({ ...invite }))

/** Volta a lista ao estado de demonstração. Existe para os testes. */
export function resetTeam(): void {
  invites = DEMO_INVITES.map((invite) => ({ ...invite }))
}

/** Situação do convite a partir das datas. */
export function inviteStatus(invite: Invite, now: Date = new Date()): InviteStatus {
  if (invite.usedAt) return 'aceito'
  if (invite.revokedAt) return 'revogado'
  return new Date(invite.expiresAt) <= now ? 'vencido' : 'pendente'
}

/** A carga de cada pessoa. Sem responsável na API, ninguém carrega requisição ainda. */
export function workloadOf(requests: readonly DataRequest[]): TeamMemberWorkload[] {
  void requests.filter((request) => isOpen(request.status) && deadlineStatusOf(request))
  return TEAM_MEMBERS.map((member) => ({ ...member, open: 0, overdue: 0 }))
}

export async function fetchTeam(): Promise<{
  members: TeamMemberWorkload[]
  invites: Invite[]
}> {
  const members = workloadOf([])
  // Convites aceitos já aparecem como pessoas da equipe.
  const shown = [...invites]
    .filter((invite) => !invite.usedAt)
    .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt))
  return { members, invites: shown }
}

/**
 * Convida alguém para atender como encarregado. O link vai por e-mail, direto
 * do servidor; um convite novo para o mesmo endereço substitui o pendente.
 */
export async function inviteMember(
  { email, jobTitle }: { email: string; jobTitle: string },
  by: Actor,
): Promise<Invite> {
  const address = email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) throw new TeamRuleError('email-invalido')
  if (TEAM_MEMBERS.some((member) => member.email === address)) {
    throw new TeamRuleError('ja-e-membro')
  }

  const { expiresAt } = await http.post<{ expiresAt: string }>(
    `/organizations/${organizationId()}/invites`,
    { email: address },
  )

  const invite: Invite = {
    // O link só existe no e-mail enviado: o servidor não devolve a ficha.
    token: '',
    email: address,
    role: 'encarregado',
    jobTitle,
    invitedBy: by.name,
    invitedByRole: 'Encarregado de proteção de dados',
    issuedAt: new Date().toISOString(),
    expiresAt,
  }
  invites = [invite, ...invites.filter((item) => item.email !== address || item.usedAt)]
  return invite
}

/** Reenviar é convidar de novo: o servidor substitui o convite pendente. */
export async function resendInvite(invite: Invite, by: Actor): Promise<Invite> {
  return inviteMember({ email: invite.email, jobTitle: invite.jobTitle ?? '' }, by)
}
