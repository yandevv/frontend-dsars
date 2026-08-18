import { describe, it, expect } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { defineComponent } from 'vue'

import BaseButton from '../BaseButton.vue'

/** Destino vazio: os testes de rota só se importam com o href gerado. */
const RouteStub = defineComponent({ template: '<div />' })

const global = { stubs: { RouterLink: RouterLinkStub } }

describe('BaseButton', () => {
  it('renderiza um <button> quando não recebe destino', () => {
    const wrapper = mount(BaseButton, { slots: { default: 'Enviar' } })

    expect(wrapper.element.tagName).toBe('BUTTON')
    expect(wrapper.attributes('type')).toBe('button')
    expect(wrapper.text()).toBe('Enviar')
  })

  it('renderiza uma <a> quando recebe href, sem atributo type', () => {
    const wrapper = mount(BaseButton, {
      props: { href: 'mailto:dpo@exemplo.org' },
      slots: { default: 'Falar com a encarregada' },
    })

    expect(wrapper.element.tagName).toBe('A')
    expect(wrapper.attributes('href')).toBe('mailto:dpo@exemplo.org')
    expect(wrapper.attributes('type')).toBeUndefined()
  })

  it('renderiza um RouterLink quando recebe to', () => {
    const wrapper = mount(BaseButton, {
      props: { to: { name: 'register' } },
      slots: { default: 'Registrar-se' },
      global,
    })

    expect(wrapper.findComponent(RouterLinkStub).props('to')).toEqual({ name: 'register' })
  })

  it('aplica o estilo primário por padrão e o secundário sob demanda', () => {
    const primary = mount(BaseButton, { slots: { default: 'Registrar-se' } })
    expect(primary.classes()).toContain('bg-brand')

    const secondary = mount(BaseButton, {
      props: { variant: 'secondary' },
      slots: { default: 'Já tenho conta' },
    })
    expect(secondary.classes()).not.toContain('bg-brand')
    expect(secondary.classes()).toContain('text-brand')
  })

  it('gera um href navegável ao apontar para uma rota', async () => {
    // Com RouterLink de verdade, e não o stub: o href só aparece quando o
    // componente não sobrescreve o que o RouterLink produz internamente.
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'home', component: RouteStub },
        { path: '/registrar', name: 'register', component: RouteStub },
      ],
    })
    router.push('/')
    await router.isReady()

    const wrapper = mount(BaseButton, {
      props: { to: { name: 'register' } },
      slots: { default: 'Registrar-se' },
      global: { plugins: [router] },
    })

    expect(wrapper.element.tagName).toBe('A')
    expect(wrapper.attributes('href')).toBe('/registrar')
  })

  it('ocupa toda a largura quando block é verdadeiro', () => {
    const wrapper = mount(BaseButton, { props: { block: true }, slots: { default: 'Entrar' } })

    expect(wrapper.classes()).toContain('w-full')
  })
})
