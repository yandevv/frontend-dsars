import { INVITE_VALIDITY_DAYS } from '@/features/auth/constants/invitePolicy'
import type { Invite } from '@/features/auth/types/invite'

const DAY_MS = 86_400_000

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * DAY_MS).toISOString()
}

/**
 * Convites do protótipo, um por estado do quadro 1c de
 * `Registro de Conta.dc.html`.
 *
 * As datas são relativas a hoje em vez de fixas: um convite "válido" com data
 * de 2026 gravada no código venceria sozinho, e a tela que ele existe para
 * demonstrar deixaria de ser alcançável. O convite já utilizado é o da conta
 * de Helena, que existe em `data/accounts.ts` — os dois protótipos contam a
 * mesma história.
 *
 * O convite em aberto usa outro endereço pelo mesmo motivo: o do design é o de
 * Helena, cuja conta já está criada, e um convite pendente para uma conta
 * existente seria contraditório.
 */
export const DEMO_INVITES: readonly Invite[] = [
  {
    token: 'convite-valido',
    email: 'bruno.carvalho@meridianosaude.org.br',
    role: 'encarregado',
    invitedBy: 'Rogério Alencar Bueno',
    invitedByRole: 'Diretoria de Governança',
    issuedAt: daysFromNow(-(INVITE_VALIDITY_DAYS - 2)),
    expiresAt: daysFromNow(2),
  },
  {
    token: 'convite-expirado',
    email: 'carla.menezes@meridianosaude.org.br',
    role: 'encarregado',
    invitedBy: 'Rogério Alencar Bueno',
    invitedByRole: 'Diretoria de Governança',
    issuedAt: daysFromNow(-19),
    expiresAt: daysFromNow(-12),
  },
  {
    token: 'convite-usado',
    email: 'helena.vasconcelos@meridianosaude.org.br',
    role: 'encarregado',
    invitedBy: 'Rogério Alencar Bueno',
    invitedByRole: 'Diretoria de Governança',
    issuedAt: daysFromNow(-16),
    expiresAt: daysFromNow(-9),
    usedAt: daysFromNow(-14),
  },
]

export function findDemoInvite(token: string): Invite | undefined {
  return DEMO_INVITES.find((invite) => invite.token === token)
}
