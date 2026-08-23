import { findDemoInvite } from '@/features/auth/data/invites'
import { delay } from '@/features/auth/services/fakeNetwork'
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

/** Busca o convite do link e recusa o que não pode mais ser aceito. */
export async function fetchInvite(token: string): Promise<Invite> {
  await delay()

  const invite = findDemoInvite(token)
  if (!invite) {
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

  const invite = findDemoInvite(token)
  if (!invite || consumedTokens.has(token) || invite.usedAt) {
    throw new InviteError('utilizado', invite)
  }

  consumedTokens.add(token)

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
