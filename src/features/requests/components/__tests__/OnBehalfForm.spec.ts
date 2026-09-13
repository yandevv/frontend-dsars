import { describe, it, expect, vi, afterEach } from 'vitest'
import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'

import OnBehalfForm from '../OnBehalfForm.vue'
import { todayInput } from '@/features/requests/utils/onBehalf'
import type { OnBehalfReceipt } from '@/features/requests/types/request'

vi.mock('@/features/auth/services/fakeNetwork', () => ({ delay: () => Promise.resolve() }))

// O jsdom não rola a página; no celular a troca de passo volta ao topo.
vi.spyOn(window, 'scrollTo').mockImplementation(() => {})

function render(receivedOn = todayInput()) {
  const state = { right: '', receivedOn }
  const wrapper = mount(OnBehalfForm, {
    props: {
      author: 'Helena Prado Vasconcelos',
      right: state.right,
      receivedOn: state.receivedOn,
      'onUpdate:right': (value: string) => wrapper.setProps({ right: value }),
      'onUpdate:receivedOn': (value: string) => wrapper.setProps({ receivedOn: value }),
    },
    global: { stubs: { RouterLink: RouterLinkStub } },
  })
  return wrapper
}

async function fillOrigin(wrapper: ReturnType<typeof render>) {
  await wrapper.find('input[name="canal-origem"][value="telefone"]').setValue(true)
  await wrapper.find('input[type="checkbox"]').setValue(true)
  await wrapper.find('input[type="radio"][value="II"]').setValue(true)
  await wrapper.find('input[type="radio"][value="completo"]').setValue(true)
  await wrapper.find('textarea').setValue(
    'Titular ligou pedindo cópia dos exames de 2025. Identidade confirmada por CPF e data de nascimento.',
  )
}

describe('OnBehalfForm', () => {
  afterEach(() => vi.useRealTimers())

  it('recusa o registro vazio e diz tudo o que falta', async () => {
    const wrapper = render()

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    const text = wrapper.text()
    expect(text).toContain('Revise os campos marcados para registrar')
    expect(text).toContain('Identifique o titular')
    expect(text).toContain('confirme a verificação de identidade')
    expect(text).toContain('informe o canal de origem')
    expect(text).toContain('escolha o direito exercido')
    expect(text).toContain('Selecione o titular do pedido para registrar.')
    expect(wrapper.emitted('registered')).toBeUndefined()
  })

  it('recusa recebimento em data futura', async () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const wrapper = render(todayInput(tomorrow))

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Informe uma data de hoje ou anterior.')
    expect(wrapper.find('input[type="date"]').attributes('max')).toBe(todayInput())
  })

  it('acha o titular no cadastro e registra em nome dele', async () => {
    vi.useFakeTimers()
    const wrapper = render()

    await wrapper.find('input[placeholder="CPF, e-mail ou nome"]').setValue('marina')
    await vi.runAllTimersAsync()
    await flushPromises()

    const pick = wrapper.findAll('button').find((button) => button.text().startsWith('Selecionar'))!
    expect(wrapper.text()).toContain('Marina Torres de Almeida')
    await pick.trigger('click')
    expect(pick.attributes('aria-pressed')).toBe('true')

    await fillOrigin(wrapper)
    await wrapper.find('form').trigger('submit')
    await vi.runAllTimersAsync()
    await flushPromises()

    const [[receipt]] = wrapper.emitted('registered') as [[OnBehalfReceipt]]
    expect(receipt.subjectName).toBe('Marina Torres de Almeida')
    expect(receipt.subjectHasAccount).toBe(true)
    expect(receipt.origin.channel).toBe('telefone')
  })

  it('registra titular sem cadastro, avisando que sem e-mail a resposta sai por carta', async () => {
    const wrapper = render()

    await wrapper.find('input[value="manual"]').setValue(true)
    expect(wrapper.text()).toContain('Sem e-mail, a resposta sai por carta')

    const inputs = wrapper.findAll('input[type="text"]')
    await inputs[0]!.setValue('Wagner Sipriano Melo')
    await inputs[1]!.setValue('318.902.774-10')
    await fillOrigin(wrapper)
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    const [[receipt]] = wrapper.emitted('registered') as [[OnBehalfReceipt]]
    expect(receipt.subjectName).toBe('Wagner Sipriano Melo')
    expect(receipt.subjectHasAccount).toBe(false)
  })

  it('no celular, só segue para a origem com o titular identificado', async () => {
    const wrapper = render()
    const next = wrapper.findAll('button').find((button) => button.text() === 'Continuar para a origem')!

    await next.trigger('click')
    expect(wrapper.text()).toContain('Passo 1 de 3')
    expect(wrapper.text()).toContain('Confirme a verificação de identidade para registrar.')

    await wrapper.find('input[value="manual"]').setValue(true)
    const inputs = wrapper.findAll('input[type="text"]')
    await inputs[0]!.setValue('Wagner Sipriano Melo')
    await inputs[1]!.setValue('318.902.774-10')
    await wrapper.find('input[type="checkbox"]').setValue(true)
    await next.trigger('click')

    expect(wrapper.text()).toContain('Passo 2 de 3')
  })
})
