import { findDemoAccount } from '@/features/auth/data/accounts'
import { delay } from '@/features/auth/services/fakeNetwork'
import type { Account, Credentials } from '@/features/auth/types/auth'
import { isConfirmedInSession } from '@/features/auth/services/emailConfirmationService'
import { currentPasswordOf } from '@/features/settings/services/securityService'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ATENÇÃO — este módulo é o lugar onde a API de autenticação vai entrar.
 *
 * Vale o mesmo aviso de `accountService.ts`: as telas já conversam com estas
 * funções, inclusive nos casos de recusa, e trocar o corpo delas por chamadas
 * HTTP não exige tocar em componente nenhum.
 *
 * Uma observação que sobrevive ao backend: a contagem de tentativas e o
 * bloqueio do RN008 são feitos aqui no navegador só porque não há servidor.
 * Proteção contra força bruta precisa morar no servidor — o que o cliente faz
 * é apenas explicar o bloqueio a quem está na tela.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Motivos de recusa que a tela sabe explicar. */
export type SignInFailure = 'credenciais-invalidas' | 'email-nao-confirmado'

export class SignInError extends Error {
  constructor(readonly reason: SignInFailure) {
    super(reason)
    this.name = 'SignInError'
  }
}

/**
 * Autentica e devolve a conta, que é quem decide o destino (RF003).
 *
 * O RN009 pede que e-mail errado e senha errada deem exatamente a mesma
 * recusa: distinguir os dois casos diria a um estranho quais endereços têm
 * conta neste portal.
 */
export async function signIn({ email, password }: Credentials): Promise<Account> {
  await delay()

  const account = findDemoAccount(email)
  // A senha vigente pode ter sido trocada nas configurações desta sessão.
  if (!account || currentPasswordOf(account.email) !== password) {
    throw new SignInError('credenciais-invalidas')
  }

  // Senha correta, mas o link do RN005 nunca foi aberto: não é uma tentativa
  // frustrada de acesso, e por isso não conta para o bloqueio.
  const emailConfirmed = account.emailConfirmed || isConfirmedInSession(account.email)
  if (!emailConfirmed) {
    throw new SignInError('email-nao-confirmado')
  }

  return {
    name: account.name,
    email: account.email,
    role: account.role,
    emailConfirmed,
  }
}
