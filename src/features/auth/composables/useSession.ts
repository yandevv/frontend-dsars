import { computed, ref, type ComputedRef } from 'vue'

import { fetchMe } from '@/features/auth/services/sessionService'
import type { Account, AccountRole } from '@/features/auth/types/auth'

/**
 * A sessão de quem está na tela.
 *
 * Quem decide se há sessão é o servidor: o navegador só guarda cookies que o
 * JavaScript não lê. Por isso a primeira navegação pergunta `GET /me` uma vez,
 * e o guarda de rotas espera a resposta antes de abrir qualquer tela restrita.
 *
 * Esconder um link aqui nunca foi proteção: a autorização mora no servidor,
 * que recusa com 403 o que o perfil não pode ver.
 */

const signedIn = ref<Account | null>(null)
let loading: Promise<Account | null> | null = null
let loaded = false

/** Conta vazia para os instantes em que a tela ainda não tem sessão. */
const NO_ACCOUNT: Account = {
  id: '',
  name: '',
  email: '',
  role: 'titular',
  emailConfirmed: false,
}

/** Carrega a sessão uma única vez; as chamadas seguintes reaproveitam a resposta. */
export function ensureSession(): Promise<Account | null> {
  if (loaded) return Promise.resolve(signedIn.value)
  loading ??= fetchMe()
    .then((account) => {
      signedIn.value = account
      return account
    })
    .catch(() => null)
    .finally(() => {
      loaded = true
      loading = null
    })
  return loading
}

/** Relê o perfil — depois de aceitar um convite, o perfil muda de titular para encarregado. */
export async function reloadSession(): Promise<Account | null> {
  loaded = false
  return ensureSession()
}

/**
 * A conta da sessão. O perfil pedido pela tela é só documentação: quem a abre
 * já passou pelo guarda de rotas, que confere o perfil antes.
 */
export function useSession(_role?: AccountRole): { account: ComputedRef<Account> } {
  return { account: computed(() => signedIn.value ?? NO_ACCOUNT) }
}

export function sessionAccount(): Account | null {
  return signedIn.value
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
  loaded = true
}

export function endSession(): void {
  signedIn.value = null
  loaded = true
}
