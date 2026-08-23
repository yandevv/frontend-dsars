import { findDemoAccount, normalizeEmail } from '@/features/auth/data/accounts'
import { delay } from '@/features/auth/services/fakeNetwork'
import type { Account, NewAccount } from '@/features/auth/types/auth'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ATENÇÃO — este módulo é o lugar onde a API de contas vai entrar.
 *
 * Enquanto o backend não existe, ele responde a partir das contas de
 * demonstração em `data/accounts.ts`. Toda a lógica de tela (erros, envio,
 * sucesso) já conversa com estas funções, então trocar o corpo delas por
 * chamadas HTTP é a única mudança necessária — nenhum componente precisa ser
 * tocado. É o mesmo papel que `useTenant()` cumpre para os dados da
 * organização.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Motivos de recusa que a tela sabe explicar. */
export type AccountFailure = 'email-em-uso'

export class AccountError extends Error {
  constructor(readonly reason: AccountFailure) {
    super(reason)
    this.name = 'AccountError'
  }
}

/** Endereços cadastrados nesta sessão, além dos de demonstração. */
const createdEmails = new Set<string>()

/**
 * Cria a conta do titular (RF002).
 *
 * Recusa endereços já cadastrados, como manda o RN004: um e-mail, uma conta.
 * A conta nasce pendente de confirmação — é o RN005 que a libera.
 */
export async function createAccount(input: NewAccount): Promise<Account> {
  await delay()

  const email = normalizeEmail(input.email)
  if (findDemoAccount(email) || createdEmails.has(email)) {
    throw new AccountError('email-em-uso')
  }

  // O backend persistirá a conta; aqui basta lembrar do endereço para que um
  // segundo cadastro igual seja recusado enquanto a aba estiver aberta.
  createdEmails.add(email)

  return {
    name: input.name.trim(),
    email,
    role: 'titular',
    emailConfirmed: false,
  }
}

/** Reenvia o link de confirmação do RN005. */
export async function resendConfirmation(email: string): Promise<void> {
  await delay()
  void email
}
