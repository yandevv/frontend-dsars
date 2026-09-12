import { TEAM_MEMBERS } from '@/features/team/data/members'
import { ORGANIZATION_DOMAIN } from '@/features/team/constants/teamPolicy'
import { createInvite, listInvites, revokeInvite } from '@/features/auth/services/inviteService'
import { deadlineStatusOf } from '@/features/requests/utils/deadline'
import { isOpen } from '@/features/requests/constants/requestStatus'
import { listRequests } from '@/features/requests/services/requestService'
import { recordAccountEvent } from '@/features/audit/services/auditService'
import { formatDate } from '@/shared/utils/date'
import type { Account } from '@/features/auth/types/auth'
import type { Invite } from '@/features/auth/types/invite'
import type { InviteStatus, TeamMemberWorkload } from '@/features/team/types/team'

/**
 * A equipe e os convites, montados a partir da fila e do serviço de convites.
 *
 * O que a tela mostra aqui é informação para gerenciar a equipe. Quem pode o
 * quê é decidido pelo servidor a cada chamada; esconder um botão não é
 * controle de acesso.
 */

export type TeamRule = 'email-invalido' | 'fora-da-organizacao' | 'ja-e-membro' | 'convite-pendente'

export class TeamRuleError extends Error {
  constructor(readonly rule: TeamRule) {
    super(rule)
    this.name = 'TeamRuleError'
  }
}

type Actor = Pick<Account, 'name' | 'email'>

const EQUIPE = { kind: 'equipe', label: 'Equipe de atendimento' } as const

/** Situação do convite a partir das datas. */
export function inviteStatus(invite: Invite, now: Date = new Date()): InviteStatus {
  if (invite.usedAt) return 'aceito'
  if (invite.revokedAt) return 'revogado'
  return new Date(invite.expiresAt) <= now ? 'vencido' : 'pendente'
}

export async function fetchTeam(): Promise<{
  members: TeamMemberWorkload[]
  invites: Invite[]
}> {
  const [requests, invites] = await Promise.all([listRequests(), listInvites()])
  const members = TEAM_MEMBERS.map((member) => {
    const mine = requests.filter(
      (request) => request.assignee === member.name && isOpen(request.status),
    )
    return {
      ...member,
      open: mine.length,
      overdue: mine.filter((request) => deadlineStatusOf(request) === 'vencida').length,
    }
  })
  // Convites aceitos já aparecem como pessoas da equipe.
  return { members, invites: invites.filter((invite) => !invite.usedAt) }
}

function assertCanInvite(email: string, invites: readonly Invite[]) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new TeamRuleError('email-invalido')
  if (!email.endsWith(`@${ORGANIZATION_DOMAIN}`)) throw new TeamRuleError('fora-da-organizacao')
  if (TEAM_MEMBERS.some((member) => member.email === email)) throw new TeamRuleError('ja-e-membro')
  if (invites.some((invite) => invite.email === email && inviteStatus(invite) === 'pendente')) {
    throw new TeamRuleError('convite-pendente')
  }
}

/** Convida alguém da organização para atender como encarregado. */
export async function inviteMember(
  { email, jobTitle }: { email: string; jobTitle: string },
  by: Actor,
): Promise<Invite> {
  const address = email.trim().toLowerCase()
  assertCanInvite(address, await listInvites())

  const invite = await createInvite({
    email: address,
    jobTitle,
    invitedBy: by.name,
    invitedByRole: 'Encarregada de proteção de dados',
  })
  recordAccountEvent(
    { ...by, role: 'encarregado' },
    {
      operation: 'criacao',
      action: 'Convite de encarregado enviado',
      detail: `Para ${address}, como ${jobTitle.toLowerCase()}. Válido até ${formatDate(invite.expiresAt)}.`,
      resource: EQUIPE,
    },
  )
  return invite
}

/** Revoga um convite ainda não usado: o link deixa de funcionar na hora. */
export async function revokeMemberInvite(invite: Invite, by: Actor): Promise<Invite> {
  const revoked = await revokeInvite(invite.token)
  recordAccountEvent(
    { ...by, role: 'encarregado' },
    {
      operation: 'alteracao',
      action: 'Convite de encarregado revogado',
      detail: `O convite para ${invite.email} deixou de valer antes do uso.`,
      resource: EQUIPE,
    },
  )
  return revoked
}

/**
 * Manda um convite novo para o mesmo endereço. O anterior, se ainda valia, é
 * revogado — dois links válidos para a mesma pessoa não têm por que existir.
 */
export async function resendInvite(invite: Invite, by: Actor): Promise<Invite> {
  if (inviteStatus(invite) === 'pendente') await revokeInvite(invite.token)
  const renewed = await createInvite({
    email: invite.email,
    jobTitle: invite.jobTitle ?? 'Analista de atendimento',
    invitedBy: by.name,
    invitedByRole: 'Encarregada de proteção de dados',
  })
  recordAccountEvent(
    { ...by, role: 'encarregado' },
    {
      operation: 'criacao',
      action: 'Convite de encarregado reenviado',
      detail: `Novo link para ${invite.email}, válido até ${formatDate(renewed.expiresAt)}.`,
      resource: EQUIPE,
    },
  )
  return renewed
}
