import { describe, it, expect, vi } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'

import HelpView from '../HelpView.vue'

const session = vi.hoisted(() => ({ role: 'titular' as 'titular' | 'encarregado' }))
vi.mock('@/features/auth/composables/useSession', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/auth/composables/useSession')>()),
  currentRole: () => session.role,
}))

function render(role: 'titular' | 'encarregado') {
  session.role = role
  return mount(HelpView, {
    global: {
      stubs: {
        RouterLink: RouterLinkStub,
        AppShell: { template: '<div><slot :account="{}" /></div>' },
      },
    },
  })
}

const headings = (wrapper: ReturnType<typeof render>) =>
  wrapper.findAll('h2').map((heading) => heading.text())

describe('HelpView', () => {
  it('mostra ao titular os direitos, os prazos e o contato da encarregada', () => {
    const wrapper = render('titular')

    expect(headings(wrapper)).toEqual([
      'Como fazer um pedido',
      'Seus direitos',
      'Prazos de resposta',
      'Acompanhar e conversar',
      'Cancelar um pedido',
      'Avaliar o atendimento',
      'Perguntas frequentes',
      'Glossário',
      'Falar com a encarregada',
    ])
    expect(wrapper.find('#direitos').findAll('li')).toHaveLength(9)
    expect(wrapper.text()).toContain('Resposta imediata')
    expect(wrapper.text()).toContain('dpo@meridianosaude.org.br')
  })

  it('mostra ao encarregado como atender, sem o contato da encarregada', () => {
    const wrapper = render('encarregado')

    expect(headings(wrapper)).toContain('Registrar em nome do titular')
    expect(headings(wrapper)).toContain('Relatório e auditoria')
    expect(headings(wrapper)).not.toContain('Seus direitos')
    expect(headings(wrapper)).not.toContain('Falar com a encarregada')
  })

  it('liga o índice a cada seção da página', () => {
    const wrapper = render('titular')
    const targets = wrapper.findAll('nav a').map((link) => link.attributes('href'))

    for (const href of targets) {
      expect(wrapper.find(href!).exists()).toBe(true)
    }
  })
})
