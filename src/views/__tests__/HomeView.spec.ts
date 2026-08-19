import { describe, it, expect } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'

import HomeView from '../HomeView.vue'

function render() {
  return mount(HomeView, { global: { stubs: { RouterLink: RouterLinkStub } } })
}

describe('HomeView', () => {
  it('monta as sete faixas do design, do cabeçalho ao rodapé', () => {
    const wrapper = render()

    expect(wrapper.find('header').exists()).toBe(true)
    expect(wrapper.find('h1').text()).toContain('Peça acesso, correção ou exclusão')
    expect(wrapper.find('a[href^="mailto:"]').exists()).toBe(true)
    expect(wrapper.find('dl').exists()).toBe(true)
    expect(wrapper.findAll('h2').map((h) => h.text())).toEqual([
      'O que você pode pedir',
      'Como o atendimento funciona',
    ])
    expect(wrapper.find('footer').exists()).toBe(true)
  })

  it('coloca o conteúdo dentro de um <main> alcançável pelo atalho de teclado', () => {
    const main = render().get('main')

    expect(main.attributes('id')).toBe('conteudo-principal')
    expect(main.attributes('tabindex')).toBe('-1')
  })

  it('usa os dados do tenant em vez de texto fixo no template', () => {
    const text = render().text()

    expect(text).toContain('Instituto Meridiano de Saúde')
    expect(text).toContain('CNPJ 12.345.678/0001-90')
    expect(text).toContain('Helena Prado Vasconcelos')
  })
})
