import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'

import InviteForm from '../InviteForm.vue'
import { ApiError } from '@/shared/api/ApiError'
import { endSession, startSession } from '@/features/auth/composables/useSession'
import type { InvitePreview } from '@/features/auth/types/invite'

const acceptInvite = vi.hoisted(() => vi.fn<(token: string) => Promise<unknown>>())
const reloadSession = vi.hoisted(() => vi.fn<() => Promise<null>>(() => Promise.resolve(null)))
const push = vi.hoisted(() => vi.fn<() => Promise<void>>(() => Promise.resolve()))

vi.mock('@/features/auth/services/inviteService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/auth/services/inviteService')>()),
  acceptInvite,
}))

vi.mock('@/features/auth/composables/useSession', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/auth/composables/useSession')>()),
  reloadSession,
}))

vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-router')>()),
  useRouter: () => ({ push }),
}))

const INVITE: InvitePreview = {
  token: 'convite-valido',
  email: 'bruno.carvalho@meridianosaude.org.br',
  organizationName: 'Instituto Meridiano de Saúde',
  expiresAt: '2026-10-03T12:00:00.000Z',
}

function signInAs(email: string) {
  startSession({
    id: 'conta-bruno',
    name: 'Bruno Carvalho de Souza',
    email,
    role: 'titular',
    emailConfirmed: true,
  })
}

function render() {
  return mount(InviteForm, {
    props: { invite: INVITE },
    global: { stubs: { RouterLink: RouterLinkStub } },
  })
}

function button(wrapper: ReturnType<typeof render>, label: string) {
  return wrapper.findAll('button').find((item) => item.text().startsWith(label))
}

describe('InviteForm', () => {
  beforeEach(() => {
    acceptInvite.mockReset()
    push.mockClear()
  })

  afterEach(() => endSession())

  it('sem sessão, leva ao acesso e volta a este convite', () => {
    endSession()
    const wrapper = render()

    const login = wrapper
      .findAllComponents(RouterLinkStub)
      .find((link) => (link.props('to') as { name?: string }).name === 'login')!

    expect(wrapper.text()).toContain('Entre com a conta deste endereço')
    expect(login.props('to')).toEqual({
      name: 'login',
      query: { redirect: '/convites/convite-valido', email: INVITE.email },
    })
    expect(acceptInvite).not.toHaveBeenCalled()
  })

  it('avisa quando a sessão é de outro endereço, antes de o servidor recusar', () => {
    signInAs('outra@exemplo.com.br')
    const wrapper = render()

    expect(wrapper.text()).toContain('Você entrou com outra conta')
    expect(button(wrapper, 'Aceitar convite')).toBeUndefined()
  })

  it('aceita com a conta convidada e relê o perfil', async () => {
    signInAs(INVITE.email)
    acceptInvite.mockResolvedValue({ organizationId: 'org-1' })
    const wrapper = render()

    await button(wrapper, 'Aceitar convite')!.trigger('click')
    await flushPromises()

    expect(acceptInvite).toHaveBeenCalledWith('convite-valido')
    expect(reloadSession).toHaveBeenCalled()
    expect(wrapper.text()).toContain('Vínculo aceito')
    expect(wrapper.emitted('accepted')).toHaveLength(1)
  })

  it('mostra a recusa do servidor', async () => {
    signInAs(INVITE.email)
    acceptInvite.mockRejectedValue(
      new ApiError(404, { detail: 'Este convite não está mais disponível. Peça um novo à organização.' }),
    )
    const wrapper = render()

    await button(wrapper, 'Aceitar convite')!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Este convite não está mais disponível')
    expect(wrapper.emitted('accepted')).toBeUndefined()
  })
})
