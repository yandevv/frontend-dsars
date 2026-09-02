import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'

import RequestDetailView from '../RequestDetailView.vue'
import { DEMO_REQUESTS } from '@/features/requests/data/requests'

// A tela conversa com o serviço; aqui ele responde na hora, sem a espera falsa.
vi.mock('@/features/auth/services/fakeNetwork', () => ({ delay: () => Promise.resolve() }))

const open = DEMO_REQUESTS.find((item) => item.status === 'em-analise')!

vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-router')>()),
  useRoute: () => ({ params: { id: open.id } }),
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
  })

  it('mostra, só no celular, o prazo relativo ao lado do estado', async () => {
    const wrapper = await render()

    const short = wrapper.find('h1 + div p.sm\\:hidden')
    expect(short.exists()).toBe(true)
    expect(short.text()).toMatch(/Venceu|Vence hoje|Falta/)
  })

  it('abre a finalização como folha de tela cheia, com o pedido fixo no topo', async () => {
    const wrapper = await render()

    const finish = wrapper.findAll('button').find((b) => b.text() === 'Finalizar atendimento')!
    await finish.trigger('click')
    await flushPromises()

    const sheet = wrapper.get('[tabindex="-1"].max-md\\:fixed')
    expect(sheet.text()).toContain(`Pedido do titular · ${open.protocol}`)
    expect(document.activeElement).toBe(sheet.element)

    await sheet.trigger('keydown', { key: 'Escape' })
    expect(wrapper.find('.max-md\\:fixed').exists()).toBe(false)
  })
})
