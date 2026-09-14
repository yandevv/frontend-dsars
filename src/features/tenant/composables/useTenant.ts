import { reactive } from 'vue'

import { institutoMeridiano } from '@/features/tenant/data/instituto-meridiano'
import { http } from '@/shared/api/http'
import type { ApiPublicOrganization } from '@/shared/api/contracts'
import type { Tenant } from '@/features/tenant/types/tenant'

/**
 * A organização controladora cujo portal está sendo exibido.
 *
 * Um portal atende uma organização, escolhida pelo `VITE_ORGANIZATION_SLUG`.
 * O perfil público é pedido uma única vez; até a resposta chegar — ou se ela
 * falhar —, valem os dados de identidade do portal.
 */
const tenant = reactive<Tenant>({
  ...institutoMeridiano,
  dpo: { ...institutoMeridiano.dpo },
})

let requested = false

export function applyOrganization(organization: ApiPublicOrganization): void {
  tenant.slug = organization.slug
  tenant.name = organization.name
  // A API não tem nome curto: o cabeçalho estreito usa o nome inteiro.
  tenant.shortName = organization.name
  tenant.rightsGuidance = organization.rightsGuidance
  tenant.dpo.name = organization.dpo.name
  tenant.dpo.email = organization.dpo.email
  tenant.dpo.phone = organization.dpo.phone ?? tenant.dpo.phone
}

function load(): void {
  if (requested) return
  requested = true
  http
    .get<ApiPublicOrganization>(`/public/organizations/${encodeURIComponent(tenant.slug)}`)
    .then(applyOrganization)
    .catch(() => {
      // Sem o perfil, o portal segue com a identidade configurada: não há por
      // que impedir alguém de ler os próprios direitos.
    })
}

export function useTenant(): { tenant: Readonly<Tenant> } {
  load()
  return { tenant }
}
