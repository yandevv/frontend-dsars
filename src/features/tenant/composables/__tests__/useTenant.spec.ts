import { describe, it, expect } from 'vitest'

import { useTenant } from '../useTenant'

describe('useTenant', () => {
  it('devolve o tenant com os dados de identificação e da encarregada', () => {
    const { tenant } = useTenant()

    expect(tenant.name).toBe('Instituto Meridiano de Saúde')
    expect(tenant.registrationId).toBe('12.345.678/0001-90')
    expect(tenant.dpo.name).toBe('Helena Prado Vasconcelos')
    expect(tenant.dpo.email).toBe('dpo@meridianosaude.org.br')
  })

  it('mostra referências legais por padrão, como no design', () => {
    const { tenant } = useTenant()

    expect(tenant.showLegalReferences).toBe(true)
  })

  it('entrega configuração imutável, incluindo os dados aninhados', () => {
    const { tenant } = useTenant()

    expect(Object.isFrozen(tenant)).toBe(true)
    expect(Object.isFrozen(tenant.dpo)).toBe(true)
  })
})
