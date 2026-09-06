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
  it('oferece os três desfechos previstos', () => {
    const wrapper = render()

    expect(wrapper.findAll('input[type="radio"]')).toHaveLength(3)
    expect(wrapper.text()).toContain('Atendido')
    expect(wrapper.text()).toContain('Parcialmente atendido')
    expect(wrapper.text()).toContain('Recusado')
  })

  it('não finaliza sem desfecho, sem texto e sem confirmação', async () => {
    const wrapper = render()

    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.text()).toContain('Ainda não é possível finalizar o atendimento')
    expect(wrapper.text()).toContain('Escolha o desfecho para finalizar o atendimento.')
  })

  it('pede fundamento legal só quando o desfecho é recusa', async () => {
    const wrapper = render()

    expect(wrapper.find('select').exists()).toBe(false)

    await wrapper.find('input[value="recusado"]').setValue()
    expect(wrapper.find('select').exists()).toBe(true)
    expect(wrapper.text()).toContain('Fundamento legal da recusa')
  })

  it('trava o envio de uma recusa sem fundamento', async () => {
    const wrapper = render()

    await wrapper.find('input[value="recusado"]').setValue()
    await wrapper.find('textarea').setValue(ANSWER)
    await wrapper.find('input[type="checkbox"]').setValue(true)
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.text()).toContain('Campo obrigatório para o desfecho recusado.')
  })

  it('troca o rótulo do texto quando o pedido é recusado', async () => {
    const wrapper = render()

    expect(wrapper.text()).toContain('Resposta ao titular')

    await wrapper.find('input[value="recusado"]').setValue()
    expect(wrapper.text()).toContain('Justificativa ao titular')
    expect(wrapper.text()).toContain('informe a quem recorrer')
  })

  it('recusa um texto curto demais para explicar o desfecho', async () => {
    const wrapper = render()

    await wrapper.find('input[value="atendido"]').setValue()
    await wrapper.find('textarea').setValue('feito')
    await wrapper.find('input[type="checkbox"]').setValue(true)
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.text()).toContain('Escreva pelo menos 40 caracteres.')
  })

  it('exige a confirmação de que a resposta encerra o atendimento', async () => {
    const wrapper = render()

    await wrapper.find('input[value="atendido"]').setValue()
    await wrapper.find('textarea').setValue(ANSWER)
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('entrega desfecho, texto e fundamento quando tudo está no lugar', async () => {
    const wrapper = render()

    await wrapper.find('input[value="recusado"]').setValue()
    await wrapper.find('textarea').setValue(ANSWER)
    await wrapper.find('select').setValue('Obrigação legal ou regulatória do controlador')
    await wrapper.find('input[type="checkbox"]').setValue(true)
    await attachResult(wrapper)
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')?.[0]?.[0]).toMatchObject({
      outcome: 'recusado',
      legalBasis: 'Obrigação legal ou regulatória do controlador',
      attachments: [RESULT],
    })
  })

  it('não leva junto um fundamento escolhido antes de trocar de desfecho', async () => {
    const wrapper = render()

    await wrapper.find('input[value="recusado"]').setValue()
    await wrapper.find('select').setValue('Exercício regular de direito em processo')
    await wrapper.find('input[value="atendido"]').setValue()
    await wrapper.find('textarea').setValue(ANSWER)
    await wrapper.find('input[type="checkbox"]').setValue(true)
    await attachResult(wrapper)
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')?.[0]?.[0]).toMatchObject({
      outcome: 'atendido',
      legalBasis: undefined,
    })
  })

  it('não finaliza sem o resultado do atendimento anexado', async () => {
    const wrapper = render()

    await wrapper.find('input[value="atendido"]').setValue()
    await wrapper.find('textarea').setValue(ANSWER)
    await wrapper.find('input[type="checkbox"]').setValue(true)
    await wrapper.find('form').trigger('submit')

    expect(wrapper.emitted('submit')).toBeUndefined()
    expect(wrapper.text()).toContain('Anexe pelo menos um arquivo com o resultado do atendimento.')
  })
})
