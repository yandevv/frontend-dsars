import { describe, it, expect, vi } from 'vitest'
import { mount, RouterLinkStub, flushPromises } from '@vue/test-utils'

import NewRequestForm from '../NewRequestForm.vue'

vi.mock('@/features/auth/services/fakeNetwork', () => ({ delay: () => Promise.resolve() }))

const account = {
  name: 'Marina Torres de Almeida',
  email: 'titular@exemplo.com.br',
  role: 'titular' as const,
  emailConfirmed: true,
}

function render() {
  return mount(NewRequestForm, {
    props: { account, right: '', 'onUpdate:right': () => {} },
    global: { stubs: { RouterLink: RouterLinkStub } },
  })
}

describe('NewRequestForm', () => {
  it('oferece os nove direitos do art. 18, um por requisição', () => {
    const radios = render().findAll('input[type="radio"]')

    expect(radios).toHaveLength(9)
    expect(new Set(radios.map((radio) => radio.attributes('name')))).toHaveProperty('size', 1)
  })

  it('recusa o envio incompleto e diz o que falta', async () => {
    const wrapper = render()

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Faltam dois campos obrigatórios')
    expect(wrapper.text()).toContain('Escolha o direito exercido e descreva o pedido')
    expect(wrapper.emitted('registered')).toBeUndefined()
  })

  it('aponta só o campo que falta quando o outro já foi preenchido', async () => {
    const wrapper = render()
    await wrapper.setProps({ right: 'VI' })

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Falta um campo obrigatório')
  })

  it('recusa uma descrição curta demais para ser atendida', async () => {
    const wrapper = render()
    await wrapper.setProps({ right: 'VI' })
    await wrapper.find('textarea').setValue('quero meus dados')

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('mínimo de 20 caracteres')
    expect(wrapper.emitted('registered')).toBeUndefined()
  })

  it('registra a requisição e entrega o comprovante à tela', async () => {
    const wrapper = render()
    await wrapper.setProps({ right: 'VI' })
    await wrapper
      .find('textarea')
      .setValue('Peço a eliminação dos meus dados de contato usados em campanhas.')

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    const registered = wrapper.emitted('registered')
    expect(registered).toHaveLength(1)
    expect(registered?.[0]?.[0]).toMatchObject({ rightNumeral: 'VI', attachmentCount: 0 })
  })

  it('mostra o prazo que começará a correr assim que o pedido estiver completo', async () => {
    const wrapper = render()
    expect(wrapper.text()).toContain('Direito exercido e descrição são obrigatórios')

    await wrapper.setProps({ right: 'III' })
    await wrapper.find('textarea').setValue('Quero corrigir o endereço do meu cadastro.')

    expect(wrapper.text()).toContain('começamos a contar o prazo até')
  })

  it('pede o formato quando o direito é o acesso aos dados', async () => {
    const wrapper = render()
    expect(wrapper.text()).not.toContain('Como você quer receber os dados?')

    await wrapper.setProps({ right: 'II' })
    await wrapper.find('textarea').setValue('Quero a cópia dos exames do primeiro semestre.')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Como você quer receber os dados?')
    expect(wrapper.text()).toContain('Escolha o formato do acesso para enviar.')
    expect(wrapper.emitted('registered')).toBeUndefined()
  })

  it('avisa que o acesso simplificado tem resposta imediata', async () => {
    const wrapper = render()
    await wrapper.setProps({ right: 'II' })
    await wrapper.find('input[value="simplificado"]').setValue(true)
    await wrapper.setProps({ accessFormat: 'simplificado' })
    await wrapper.find('textarea').setValue('Quero ver os dados do meu cadastro.')

    expect(wrapper.text()).toContain('Este pedido tem resposta imediata')

    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(wrapper.emitted('registered')?.[0]?.[0]).toMatchObject({ immediate: true })
  })
})
