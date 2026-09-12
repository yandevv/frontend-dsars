import type { RouteLocationRaw } from 'vue-router'

import type { AccountRole } from '@/features/auth/types/auth'

/**
 * Para onde cada perfil vai ao entrar. O portal não pergunta: o perfil vem da
 * conta, e cada um começa pelo que usa todo dia — o titular pelos próprios
 * pedidos, a encarregada pela fila da organização.
 */
export const ROLE_HOME: Record<AccountRole, RouteLocationRaw> = {
  titular: { name: 'my-requests' },
  encarregado: { name: 'request-queue' },
}
