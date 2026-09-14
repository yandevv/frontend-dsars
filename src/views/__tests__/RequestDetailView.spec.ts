import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'

import RequestDetailView from '../RequestDetailView.vue'
import { startSession } from '@/features/auth/composables/useSession'
import { mockApi, route } from '@/test/api'
import { apiDetails, isoFromNow } from '@/test/factories'

vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-router')>()),
  useRoute: () => ({ params: { id: 'r418' } }),
  useRouter: () => ({ push: vi.fn<() => void>() }),
}))

async function render() {
  const wrapper = mount(RequestDetailView, {
    attachTo: document.body,
    global: { stubs: { RouterLink: RouterLinkStub } },
  })
  await flushPromises()
  return wrapper
}

describe('RequestDetailView', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    startSession({
      id: 'conta-helena',
      name: 'Helena Prado Vasconcelos',
      email: 'helena@meridiano.org.br',
      role: 'encarregado',
      emailConfirmed: true,
      organizationId: 'org-1',
    })
    mockApi([
      route(
        'GET',
        '/requests/r418',
        apiDetails({
          id: 'r418',
          protocolNumber: '2026-000418',
          dataSubject: { id: 'titular-1', fullName: 'Marina Torres de Almeida', email: 'marina@exemplo.com.br' },
          registeredAt: isoFromNow(-17 * 86_400_000),
          dueAt: isoFromNow(-2 * 86_400_000),
          deadlineStatus: 'OVERDUE',
          viewerRoles: ['DPO'],
        }),
      ),
      route('GET', '/requests/r418/messages', { items: [] }),
      route('GET', '/organizations/org-1/requests', { items: [], page: 1, pageSize: 50, total: 0 }),
    ])
  })

  it('mostra o titular e avisa que o prazo venceu', async () => {
    const wrapper = await render()

    expect(wrapper.text()).toContain('Marina Torres de Almeida')
    expect(wrapper.text()).toContain('Requisição fora do prazo legal')
  })

  it('mostra, só no celular, o prazo relativo ao lado do estado', async () => {
    const wrapper = await render()

    const short = wrapper.find('h1 + div p.sm\\:hidden')
    expect(short.exists()).toBe(true)
    expect(short.text()).toMatch(/Venceu/)
  })

  it('abre a finalização como folha de tela cheia, com o pedido fixo no topo', async () => {
    const wrapper = await render()

    const finish = wrapper.findAll('button').find((b) => b.text() === 'Finalizar atendimento')!
    await finish.trigger('click')
    await flushPromises()

    const sheet = wrapper.get('[tabindex="-1"].max-md\\:fixed')
    expect(sheet.text()).toContain('Pedido do titular · 2026-000418')
    expect(document.activeElement).toBe(sheet.element)

    await sheet.trigger('keydown', { key: 'Escape' })
    expect(wrapper.find('.max-md\\:fixed').exists()).toBe(false)
  })
})
