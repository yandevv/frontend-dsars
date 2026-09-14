import { describe, it, expect, vi } from 'vitest'
import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'

import OnBehalfForm from '../OnBehalfForm.vue'
import { ApiError } from '@/shared/api/ApiError'
import { registerOnBehalf } from '@/features/requests/services/requestService'
import type { OnBehalfReceipt, OnBehalfRequest } from '@/features/requests/types/request'

vi.mock('@/features/requests/services/requestService', () => ({
  registerOnBehalf: vi.fn<(input: OnBehalfRequest) => Promise<OnBehalfReceipt>>(
    async (input) => ({
      protocol: '2026-000210',
      id: '01920000-0000-7000-8000-000000000210',
      rightNumeral: input.rightNumeral,
      registeredAt: new Date().toISOString(),
      dueAt: new Date().toISOString(),
      immediate: false,
      attachmentCount: 0,
      subjectEmail: input.subjectEmail.trim().toLowerCase(),
      origin: { channel: input.channel!, reference: input.reference || undefined },
    }),
  ),
}))

// O jsdom não rola a página; no celular a troca de passo volta ao topo.
vi.spyOn(window, 'scrollTo').mockImplementation(() => {})

function render() {
  const wrapper = mount(OnBehalfForm, {
    props: {
      right: '',
      'onUpdate:right': (value: string) => wrapper.setProps({ right: value }),
    },
    global: { stubs: { RouterLink: RouterLinkStub } },
  })
  return wrapper
}

async function fillAll(wrapper: ReturnType<typeof render>) {
  await wrapper.find('input[type="email"]').setValue('Marina@Exemplo.com.br')
  await wrapper.find('input[type="checkbox"]').setValue(true)
  await wrapper.find('input[name="canal-origem"][value="PHONE"]').setValue(true)
  await wrapper.find('input[type="radio"][value="II"]').setValue(true)
  await wrapper.find('input[type="radio"][value="completo"]').setValue(true)
  await wrapper.find('textarea').setValue(
    'Titular ligou pedindo cópia dos exames de 2025. Identidade confirmada por CPF e data de nascimento.',
  )
}

describe('OnBehalfForm', () => {
  it('recusa o registro vazio e diz tudo o que falta', async () => {
    const wrapper = render()

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    const text = wrapper.text()
    expect(text).toContain('Revise os campos marcados para registrar')
    expect(text).toContain('Informe o e-mail da conta do titular')
    expect(text).toContain('confirme a verificação de identidade')
    expect(text).toContain('informe o canal de origem')
    expect(text).toContain('escolha o direito exercido')
    expect(wrapper.emitted('registered')).toBeUndefined()
  })

  it('registra em nome do titular pelo e-mail da conta', async () => {
    const wrapper = render()

    await fillAll(wrapper)
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    const [[receipt]] = wrapper.emitted('registered') as [[OnBehalfReceipt]]
    expect(receipt.subjectEmail).toBe('marina@exemplo.com.br')
    expect(receipt.origin.channel).toBe('PHONE')
    expect(vi.mocked(registerOnBehalf).mock.calls[0]![0]).toMatchObject({
      rightNumeral: 'II',
      accessFormat: 'completo',
      identityVerified: true,
    })
  })

  it('mostra a recusa do servidor quando o titular não tem conta', async () => {
    vi.mocked(registerOnBehalf).mockRejectedValueOnce(
      new ApiError(422, {
        detail: 'Não há conta ativa e com e-mail confirmado para este endereço.',
      }),
    )
    const wrapper = render()

    await fillAll(wrapper)
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Não há conta ativa e com e-mail confirmado')
    expect(wrapper.emitted('registered')).toBeUndefined()
  })

  it('no celular, só segue para a origem com o titular identificado', async () => {
    const wrapper = render()
    const next = wrapper.findAll('button').find((button) => button.text() === 'Continuar para a origem')!

    await next.trigger('click')
    expect(wrapper.text()).toContain('Passo 1 de 3')
    expect(wrapper.text()).toContain('Confirme a verificação de identidade para registrar.')

    await wrapper.find('input[type="email"]').setValue('marina@exemplo.com.br')
    await wrapper.find('input[type="checkbox"]').setValue(true)
    await next.trigger('click')

    expect(wrapper.text()).toContain('Passo 2 de 3')
  })
})
