import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, nextTick, ref } from 'vue'

import BaseDialog from '../BaseDialog.vue'

/** Uma página mínima: o botão que abre e a janela com um campo e dois botões. */
const Host = defineComponent({
  components: { BaseDialog },
  props: { locked: { type: Boolean, default: false } },
  setup() {
    return { open: ref(false) }
  },
  template: `
    <div>
      <button id="trigger" @click="open = true">Cancelar requisição</button>
      <BaseDialog v-model:open="open" title="Cancelar a requisição?" eyebrow="Cancelamento" :locked="locked">
        <textarea id="reason" />
        <template #note>Fica na trilha de auditoria.</template>
        <template #actions>
          <button id="keep" @click="open = false">Manter</button>
          <button id="confirm">Confirmar</button>
        </template>
      </BaseDialog>
    </div>
  `,
})

function dialog(): HTMLElement | null {
  return document.body.querySelector('[role="dialog"]')
}

async function openDialog(props: { locked?: boolean } = {}) {
  const wrapper = mount(Host, { props, attachTo: document.body })
  const trigger = wrapper.get<HTMLButtonElement>('#trigger')
  trigger.element.focus()
  await trigger.trigger('click')
  await nextTick()
  await nextTick()
  return wrapper
}

function press(key: string, shiftKey = false) {
  dialog()!.dispatchEvent(new KeyboardEvent('keydown', { key, shiftKey, bubbles: true }))
}

describe('BaseDialog', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    document.body.style.overflow = ''
  })

  it('abre como diálogo modal nomeado pelo título', async () => {
    await openDialog()

    const element = dialog()!
    expect(element.getAttribute('aria-modal')).toBe('true')
    const title = document.getElementById(element.getAttribute('aria-labelledby')!)
    expect(title?.textContent).toContain('Cancelar a requisição?')
    expect(element.textContent).toContain('Fica na trilha de auditoria.')
  })

  it('leva o foco ao primeiro campo e trava a rolagem da página', async () => {
    await openDialog()

    expect(document.activeElement?.id).toBe('reason')
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('fecha com Esc e devolve o foco a quem abriu', async () => {
    await openDialog()

    press('Escape')
    await nextTick()
    await nextTick()

    expect(dialog()).toBeNull()
    expect(document.activeElement?.id).toBe('trigger')
    expect(document.body.style.overflow).toBe('')
  })

  it('mantém o Tab circulando dentro da janela', async () => {
    await openDialog()

    ;(document.getElementById('confirm') as HTMLElement).focus()
    press('Tab')
    expect(document.activeElement?.textContent).toContain('Fechar')

    press('Tab', true)
    expect(document.activeElement?.id).toBe('confirm')
  })

  it('fecha ao clicar fora, mas não durante um envio', async () => {
    const wrapper = await openDialog({ locked: true })

    ;(dialog()!.parentElement as HTMLElement).click()
    press('Escape')
    await nextTick()
    expect(dialog()).not.toBeNull()

    await wrapper.setProps({ locked: false })
    ;(dialog()!.parentElement as HTMLElement).click()
    await nextTick()
    expect(dialog()).toBeNull()
  })
})
