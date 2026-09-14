import { describe, it, expect } from 'vitest'

import { applyOrganization, useTenant } from '../useTenant'

describe('useTenant', () => {
  it('começa com a identidade configurada do portal', () => {
    const { tenant } = useTenant()

    expect(tenant.slug).toBe('demonstracao')
    expect(tenant.registrationId).toBe('12.345.678/0001-90')
    expect(tenant.dpo.name).toBeTruthy()
  })

  it('troca nome e contato do encarregado pelo perfil público da organização', () => {
    const { tenant } = useTenant()

    applyOrganization({
      slug: 'demonstracao',
      name: 'Organização Demonstração',
      dpo: { name: 'Ana Encarregada', email: 'ana@demonstracao.test', phone: null },
      rightsGuidance: 'Envie seu pedido pelo portal.',
    })

    expect(tenant.name).toBe('Organização Demonstração')
    expect(tenant.shortName).toBe('Organização Demonstração')
    expect(tenant.dpo.email).toBe('ana@demonstracao.test')
    expect(tenant.rightsGuidance).toBe('Envie seu pedido pelo portal.')
    // Sem telefone no perfil, fica o configurado.
    expect(tenant.dpo.phone).toBeTruthy()
    // CNPJ e endereço não estão na API: seguem os do portal.
    expect(tenant.registrationId).toBe('12.345.678/0001-90')
  })
})
