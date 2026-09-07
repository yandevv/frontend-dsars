import { computed, ref, type ComputedRef } from 'vue'

import { DEMO_ACCOUNTS } from '@/features/auth/data/accounts'
import type { Account, AccountRole } from '@/features/auth/types/auth'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ATENÇÃO — aqui entra a sessão de verdade.
 *
 * Quando houver servidor, `account` passa a ser lida do token devolvido pelo
 * acesso, e a queda para a conta de demonstração some junto com este comentário.
 *
 * Enquanto isso não existe sessão nenhuma: nada é guardado entre recargas e
 * ninguém é barrado. Por isso `useSession()` recebe o perfil que a tela exige
 * e, se ninguém entrou pelo formulário de acesso, devolve a conta de
 * demonstração daquele perfil — é o que permite abrir qualquer tela do sistema
 * digitando a URL, inclusive nos testes e nas capturas de tela.
 *
 * Uma consequência a não esquecer: **a autorização não está implementada**.
 * Decidir quem pode ver a fila da organização é trabalho do servidor; esconder
 * um link no navegador nunca foi proteção.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const signedIn = ref<Account | null>(null)

function demoAccountFor(role: AccountRole): Account {
  const account = DEMO_ACCOUNTS.find((item) => item.role === role && item.emailConfirmed)
  if (!account) throw new Error(`Nenhuma conta de demonstração com o perfil ${role}.`)

  const { name, email, emailConfirmed } = account
  return { name, email, role, emailConfirmed }
}

export function useSession(role: AccountRole): { account: ComputedRef<Account> } {
  const account = computed(() => {
    const current = signedIn.value
    return current && current.role === role ? current : demoAccountFor(role)
  })

  return { account }
}

/**
 * O perfil de quem está na tela, para as páginas comuns aos dois lados —
 * notificações, configurações, ajuda. Sem ninguém autenticado, vale o titular:
 * é o perfil de quem chega ao portal pela porta pública.
 */
export function currentRole(): AccountRole {
  return signedIn.value?.role ?? 'titular'
}

/** Chamada pelo formulário de acesso quando a autenticação dá certo. */
export function startSession(account: Account): void {
  signedIn.value = account
}

export function endSession(): void {
  signedIn.value = null
}
