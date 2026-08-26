import type { RouteLocationRaw } from 'vue-router'

/** Item de navegação do cabeçalho ou do menu da conta. */
export interface AppNavItem {
  label: string
  to: RouteLocationRaw
}

/**
 * A área do sistema em que a pessoa está.
 *
 * O portal do titular e a área do encarregado são o mesmo produto com o mesmo
 * cabeçalho: o que muda é a linha sob o nome da organização, os destinos da
 * navegação e o que o menu da conta oferece.
 */
export interface AppArea {
  /** Linha sob o nome da organização — "Portal do titular de dados". */
  subtitle: string
  /** Como o perfil é apresentado no menu da conta. */
  roleLabel: string
  nav: readonly AppNavItem[]
  accountLinks: readonly AppNavItem[]
}
