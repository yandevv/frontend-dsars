import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'

import DpoContactCard from '../DpoContactCard.vue'
import type { DataProtectionOfficer } from '@/features/tenant/types/tenant'

const dpo: DataProtectionOfficer = {
  name: 'Helena Prado Vasconcelos',
  role: 'Encarregada de proteção de dados',
  blurb: 'É a pessoa responsável por receber os seus pedidos.',
  email: 'dpo@meridianosaude.org.br',
  phone: '(16) 3711-0480',
  officeHours: 'dias úteis, 9h às 17h',
}

const address = 'Av. Brasil, 1420 — Franca/SP, 14401-135'

function render() {
  return mount(DpoContactCard, { props: { dpo, address } })
}

describe('DpoContactCard', () => {
  it('identifica a pessoa encarregada e o seu papel', () => {
    const wrapper = render()

    expect(wrapper.text()).toContain('Helena Prado Vasconcelos')
    expect(wrapper.text()).toContain('Encarregada de proteção de dados')
  })

  it('oferece o e-mail como link acionável', () => {
    const link = render().get('a[href^="mailto:"]')

    expect(link.attributes('href')).toBe('mailto:dpo@meridianosaude.org.br')
    expect(link.text()).toBe('dpo@meridianosaude.org.br')
  })

  it('transforma o telefone formatado em um link discável', () => {
    const link = render().get('a[href^="tel:"]')

    expect(link.attributes('href')).toBe('tel:+551637110480')
    expect(link.text()).toBe('(16) 3711-0480')
  })

  it('mostra o endereço da organização e o horário de atendimento', () => {
    const text = render().text()

    expect(text).toContain(address)
    expect(text).toContain('dias úteis, 9h às 17h')
  })
})
