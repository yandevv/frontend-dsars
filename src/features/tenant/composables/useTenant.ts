import { institutoMeridiano } from '@/features/tenant/data/instituto-meridiano'
import type { Tenant } from '@/features/tenant/types/tenant'

/**
 * Fornece o tenant cujo portal está sendo exibido.
 *
 * Esta função é a única emenda entre a interface e a origem dos dados: quando
 * o back-end existir, basta trocar o corpo daqui (por exemplo, resolvendo o
 * tenant pelo subdomínio) sem tocar em nenhum componente.
 */
export function useTenant(): { tenant: Readonly<Tenant> } {
  return { tenant: institutoMeridiano }
}
