import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'

import BaseSwitch from '../BaseSwitch.vue'

function render(props: { modelValue: boolean; locked?: boolean; disabled?: boolean }) {
  return mount(BaseSwitch, { props: { label: 'SMS para Prazo', ...props } })
}

describe('BaseSwitch', () => {
  it('é um interruptor acessível que diz o próprio estado', () => {
    const wrapper = render({ modelValue: true })
    const button = wrapper.get('button')

    expect(button.attributes('role')).toBe('switch')
    expect(button.attributes('aria-checked')).toBe('true')
    expect(button.attributes('aria-label')).toBe('SMS para Prazo')
    expect(wrapper.text()).toContain('Ligado')
  })

  it('alterna ao clicar', async () => {
    const wrapper = render({ modelValue: false })

    await wrapper.get('button').trigger('click')

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
  })

  it('travado não muda e diz que está travado', async () => {
    const wrapper = render({ modelValue: true, locked: true })

    await wrapper.get('button').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.text()).toContain('Travado')
    expect(wrapper.get('button').attributes('aria-disabled')).toBe('true')
  })

  it('indisponível também não muda', async () => {
    const wrapper = render({ modelValue: false, disabled: true })

    await wrapper.get('button').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.text()).toContain('Indisponível')
  })
})
