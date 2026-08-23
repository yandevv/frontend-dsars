import type { AccountRole } from '@/features/auth/types/auth'

/** Para onde cada perfil é levado depois de entrar (RF003). */
export interface SignInDestination {
  role: AccountRole
  label: string
  description: string
}

export const SIGN_IN_DESTINATIONS: readonly SignInDestination[] = [
  {
    role: 'titular',
    label: 'Titular',
    description: 'Portal de requisições: seus pedidos, prazos e respostas.',
  },
  {
    role: 'encarregado',
    label: 'Encarregado',
    description: 'Painel de atendimento: fila das requisições da organização.',
  },
]
