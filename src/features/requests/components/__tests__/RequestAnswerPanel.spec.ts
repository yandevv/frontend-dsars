import { describe, it, expect } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'

import AttachmentPicker from '../AttachmentPicker.vue'
import RequestAnswerPanel from '../RequestAnswerPanel.vue'

const ANSWER =
  'Eliminamos seus dados de contato das bases de comunicação da rede. O prontuário permanece por obrigação legal.'

const RESULT = { name: 'comprovante-eliminacao.pdf', meta: 'PDF · 120 KB' }

/** O seletor lê arquivos do aparelho; aqui entra direto o que ele entregaria. */
async function attachResult(wrapper: ReturnType<typeof render>) {
  wrapper.findComponent(AttachmentPicker).vm.$emit('update:modelValue', [RESULT])
  await wrapper.vm.$nextTick()
}

function render() {
  return mount(RequestAnswerPanel, {
    global: { stubs: { RouterLink: RouterLinkStub } },
  })
}

describe('RequestAnswerPanel', () => {
  it('não finaliza sem parecer, sem resultado e sem confirmação', async () => {
    const wrapper = render()

    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.text()).toContain('Ainda não é possível finalizar o atendimento')
    expect(wrapper.text()).toContain('Escreva o parecer que vai ao titular.')
    expect(wrapper.text()).toContain('Anexe pelo menos um arquivo com o resultado do atendimento.')
  })

  it('não oferece desfecho nem fundamento: o parecer é o texto e o resultado anexado', () => {
    const wrapper = render()

    expect(wrapper.findAll('input[type="radio"]')).toHaveLength(0)
    expect(wrapper.find('select').exists()).toBe(false)
  })

  it('exige a confirmação de que a resposta encerra o atendimento', async () => {
    const wrapper = render()
    await wrapper.find('textarea').setValue(ANSWER)
    await attachResult(wrapper)

    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('não finaliza sem o resultado do atendimento anexado', async () => {
    const wrapper = render()
    await wrapper.find('textarea').setValue(ANSWER)
    await wrapper.find('input[type="checkbox"]').setValue(true)

    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.text()).toContain('Anexe pelo menos um arquivo com o resultado do atendimento.')
  })

  it('entrega o parecer e o resultado quando tudo está no lugar', async () => {
    const wrapper = render()
    await wrapper.find('textarea').setValue(ANSWER)
    await attachResult(wrapper)
    await wrapper.find('input[type="checkbox"]').setValue(true)

    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')?.[0]?.[0]).toEqual({ text: ANSWER, attachments: [RESULT] })
  })
})
