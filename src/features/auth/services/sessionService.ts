import { http } from '@/shared/api/http'
import { isApiError } from '@/shared/api/ApiError'
import type { ApiProfile } from '@/shared/api/contracts'
import type { Account, Credentials } from '@/features/auth/types/auth'

/**
 * Autenticação contra a API.
 *
 * A sessão fica em cookies `httpOnly` que o navegador guarda e reenvia: o que
 * volta no corpo é só o perfil, e é ele que decide o destino depois do acesso.
 *
 * O servidor recusa com a mesma resposta credencial errada e conta bloqueada
 * (RN008/RN009): distinguir as duas diria a um estranho quais endereços têm
 * conta neste portal. A tela apenas repete o texto que ele devolve.
 */

/** Traduz o perfil da API para a conta da interface. */
export function toAccount(profile: ApiProfile): Account {
  const dpo = profile.memberships.find((membership) => membership.role === 'DPO')

  return {
    id: profile.id,
    name: profile.fullName,
    email: profile.email,
    role: dpo ? 'encarregado' : 'titular',
    emailConfirmed: profile.emailVerified,
    organizationId: dpo?.organizationId,
    organizationName: dpo?.organizationName,
  }
}

export async function signIn({ email, password, rememberMe = false }: Credentials): Promise<Account> {
  const { user } = await http.post<{ user: ApiProfile }>('/auth/login', {
    email,
    password,
    rememberMe,
  })
  return toAccount(user)
}

export async function signOut(): Promise<void> {
  try {
    await http.post('/auth/logout')
  } catch {
    // Sair não pode falhar do ponto de vista de quem está na tela: os cookies
    // vencem de qualquer forma, e a sessão local é encerrada logo em seguida.
  }
}

/** A conta da sessão atual, ou `null` quando não há ninguém autenticado. */
export async function fetchMe(): Promise<Account | null> {
  try {
    return toAccount(await http.get<ApiProfile>('/me'))
  } catch (error) {
    if (isApiError(error, 401)) return null
    throw error
  }
}

/** Conclui o cadastro começado pelo Google: o aceite que o Google não coleta. */
export async function completeGoogleSignup(): Promise<Account> {
  const { user } = await http.post<{ user: ApiProfile }>('/auth/google/complete', {
    acceptedTerms: true,
    acceptedPrivacyNotice: true,
  })
  return toAccount(user)
}
