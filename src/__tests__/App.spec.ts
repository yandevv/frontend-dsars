import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'

import App from '../App.vue'

describe('App', () => {
  it('oferece um atalho de teclado para pular direto ao conteúdo principal', () => {
    const wrapper = mount(App, { global: { stubs: { RouterView: true } } })
    const skipLink = wrapper.get('a')

    expect(skipLink.attributes('href')).toBe('#conteudo-principal')
    expect(skipLink.text()).toBe('Ir para o conteúdo principal')
    // Fica escondido até receber foco.
    expect(skipLink.classes()).toContain('sr-only')
  })

  it('renderiza a rota ativa', () => {
    const wrapper = mount(App, { global: { stubs: { RouterView: true } } })

    expect(wrapper.find('router-view-stub').exists()).toBe(true)
  })
})
