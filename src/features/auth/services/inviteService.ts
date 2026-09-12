import { DEMO_INVITES } from '@/features/auth/data/invites'
import { INVITE_VALIDITY_DAYS } from '@/features/auth/constants/invitePolicy'
import { delay } from '@/features/auth/services/fakeNetwork'
import { daysFromNow } from '@/shared/utils/date'
import { uuidv7 } from '@/shared/utils/uuid'
import type { Account } from '@/features/auth/types/auth'
import type { Invite, InviteAcceptance } from '@/features/auth/types/invite'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ATENÇÃO — este módulo é o lugar onde a API de convites vai entrar.
 *
 * Vale aqui o mesmo que em `accountService.ts`: as telas já conversam com
 * estas funções, inclusive nos caminhos de recusa, e trocar o corpo delas por
 * chamadas HTTP não toca em nenhum componente.
 *
 * Uma observação de segurança: quem valida um convite é o servidor. Conferir
 * o vencimento aqui serve para a tela ter o que mostrar enquanto não há
 * backend — não é controle de acesso, porque o token e a data vivem no
 * navegador de quem abre o link.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Motivos pelos quais um convite não leva ao formulário. */
export type InviteFailure = 'expirado' | 'utilizado' | 'invalido'

export class InviteError extends Error {
  constructor(
    readonly reason: InviteFailure,
    /** O convite recusado, quando existe — a tela cita o endereço e as datas. */
    readonly invite?: Invite,
  ) {
    super(reason)
    this.name = 'InviteError'
  }
}

/** Tokens aceitos nesta sessão, para que o mesmo link não sirva duas vezes. */
const consumedTokens = new Set<string>()

/** Cópia viva dos convites: a tela da equipe cria, reenvia e revoga. */
let invites: Invite[] = DEMO_INVITES.map((invite) => ({ ...invite }))

function findInvite(token: string): Invite | undefined {
  return invites.find((invite) => invite.token === token)
}

/** Todos os convites da organização, do mais recente para o mais antigo. */
export async function listInvites(): Promise<Invite[]> {
  await delay(300)
  return [...invites].sort((a, b) => b.issuedAt.localeCompare(a.issuedAt))
}

/**
 * Emite um convite de encarregado. O perfil vem fixo: é pelo convite, e só
 * por ele, que alguém passa a atender em nome da organização.
 */
export async function createInvite({
  email,
  jobTitle,
  invitedBy,
  invitedByRole,
}: {
  email: string
  jobTitle: string
  invitedBy: string
  invitedByRole: string
}): Promise<Invite> {
  await delay()
  const invite: Invite = {
    // No servidor o token é aleatório e longo; aqui o UUID v7 faz esse papel.
    token: uuidv7(),
    email: email.trim().toLowerCase(),
    role: 'encarregado',
    jobTitle,
    invitedBy,
    invitedByRole,
    issuedAt: new Date().toISOString(),
    expiresAt: daysFromNow(INVITE_VALIDITY_DAYS),
  }
  invites = [invite, ...invites]
  return invite
}

/** Tira a validade de um convite que ainda não foi usado. */
export async function revokeInvite(token: string): Promise<Invite> {
  await delay()
  const invite = findInvite(token)
  if (!invite || invite.usedAt || consumedTokens.has(token)) {
    throw new InviteError('utilizado', invite)
  }
  invite.revokedAt = new Date().toISOString()
  return { ...invite }
}

/** Volta os convites ao estado de demonstração. Existe para os testes. */
export function resetInvites(): void {
  invites = DEMO_INVITES.map((invite) => ({ ...invite }))
  consumedTokens.clear()
}

/** Busca o convite do link e recusa o que não pode mais ser aceito. */
export async function fetchInvite(token: string): Promise<Invite> {
  await delay()

  const invite = findInvite(token)
  // Revogado responde como inválido: o link não diz por que deixou de valer.
  if (!invite || invite.revokedAt) {
    throw new InviteError('invalido')
  }

  if (invite.usedAt || consumedTokens.has(token)) {
    throw new InviteError('utilizado', invite)
  }

  if (new Date(invite.expiresAt).getTime() <= Date.now()) {
    throw new InviteError('expirado', invite)
  }

  return invite
}

/**
 * Cria a conta vinculada ao convite.
 *
 * Nasce com o e-mail já confirmado, ao contrário do cadastro comum: o link do
 * convite foi enviado para aquele endereço e aberto por quem o recebeu, o que
 * é a mesma prova que o RN005 pede — repetir a confirmação seria pedir duas
 * vezes o que já foi demonstrado uma.
 */
export async function acceptInvite({ token, name }: InviteAcceptance): Promise<Account> {
  await delay()

  const invite = findInvite(token)
  if (!invite || invite.revokedAt) throw new InviteError('invalido')
  if (consumedTokens.has(token) || invite.usedAt) {
    throw new InviteError('utilizado', invite)
  }

  consumedTokens.add(token)
  invite.usedAt = new Date().toISOString()

  return {
    name: name.trim(),
    email: invite.email,
    role: invite.role,
    emailConfirmed: true,
  }
}

/** Recusa o convite e avisa quem o enviou. */
export async function declineInvite(token: string): Promise<void> {
  await delay()
  consumedTokens.add(token)
}

/** Pede um convite novo quando o anterior venceu. */
export async function requestNewInvite(token: string): Promise<void> {
  await delay()
  void token
}
