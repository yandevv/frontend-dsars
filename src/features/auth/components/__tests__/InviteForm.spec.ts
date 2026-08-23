import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises, mount, RouterLinkStub, type VueWrapper } from '@vue/test-utils'

import InviteForm from '../InviteForm.vue'
import { InviteError } from '@/features/auth/services/inviteService'
import type { Account } from '@/features/auth/types/auth'
import type { Invite, InviteAcceptance } from '@/features/auth/types/invite'

const acceptInvite = vi.hoisted(() => vi.fn<(input: InviteAcceptance) => Promise<Account>>())

vi.mock('@/features/auth/services/inviteService', async (importOriginal) => ({
  // `InviteError` real: o componente decide o que mostrar com `instanceof`.
  ...(await importOriginal<typeof import('@/features/auth/services/inviteService')>()),
  acceptInvite,
}))

const VALID_PASSWORD = 'SenhaSegura!123'

const INVITE: Invite = {
  token: 'convite-valido',
  email: 'bruno.carvalho@meridianosaude.org.br',
  role: 'encarregado',
  invitedBy: 'Rogério Alencar Bueno',
  invitedByRole: 'Diretoria de Governança',
  issuedAt: '2026-09-12T12:00:00.000Z',
  expiresAt: '2026-09-19T12:00:00.000Z',
}

const ACCOUNT: Account = {
  name: 'Bruno Carvalho de Souza',
  email: INVITE.email,
  role: 'encarregado',
  emailConfirmed: true,
}

function render() {
  return mount(InviteForm, {
    props: { invite: INVITE },
    global: { stubs: { RouterLink: RouterLinkStub } },
  })
}

async function fill(wrapper: VueWrapper, { terms = true } = {}) {
  await wrapper.get('input[autocomplete="name"]').setValue('Bruno Carvalho de Souza')

  const passwords = wrapper.findAll('input[type="password"]')
  await passwords[0]!.setValue(VALID_PASSWORD)
  await passwords[1]!.setValue(VALID_PASSWORD)

  if (terms) await wrapper.get('input[type="checkbox"]').setValue(true)
}

async function submit(wrapper: VueWrapper) {
  await wrapper.get('form').trigger('submit')
  await flushPromises()
}

describe('InviteForm', () => {
  beforeEach(() => {
    acceptInvite.mockReset()
    acceptInvite.mockResolvedValue(ACCOUNT)
  })

  it('mostra o e-mail do convite travado, com a explicação do porquê', () => {
    const wrapper = render()
    const email = wrapper.get('input[type="email"]')

    expect((email.element as HTMLInputElement).value).toBe(INVITE.email)
    expect(email.attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('não pode ser alterado')
  })

  it('não chama o serviço enquanto faltar campo', async () => {
    const wrapper = render()
    await submit(wrapper)

    expect(acceptInvite).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Ainda não é possível criar a conta')
  })

  it('exige o aceite dos termos', async () => {
    const wrapper = render()
    await fill(wrapper, { terms: false })
    await submit(wrapper)

    expect(acceptInvite).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('O aceite é obrigatório para criar a conta.')
  })

  it('envia o token do convite, nunca um e-mail digitado', async () => {
    const wrapper = render()
    await fill(wrapper)
    await submit(wrapper)

    expect(acceptInvite).toHaveBeenCalledWith({
      token: INVITE.token,
      name: 'Bruno Carvalho de Souza',
      password: VALID_PASSWORD,
    })
  })

  it('confirma a conta criada e avisa que o e-mail dispensa confirmação', async () => {
    const wrapper = render()
    await fill(wrapper)
    await submit(wrapper)

    expect(wrapper.text()).toContain('Conta criada e vínculo aceito')
    expect(wrapper.text()).toContain('não precisa de confirmação')
    expect(wrapper.emitted('accepted')).toHaveLength(1)
  })

  it('explica o convite consumido enquanto a página estava aberta', async () => {
    acceptInvite.mockRejectedValue(new InviteError('utilizado', INVITE))

    const wrapper = render()
    await fill(wrapper)
    await submit(wrapper)

    expect(wrapper.text()).toContain('Este convite já foi usado')
    expect(wrapper.find('form').exists()).toBe(true)
  })

  it('não confunde falha de rede com convite gasto', async () => {
    acceptInvite.mockRejectedValue(new Error('sem rede'))

    const wrapper = render()
    await fill(wrapper)
    await submit(wrapper)

    expect(wrapper.text()).toContain('Não conseguimos criar a conta agora')
    expect(wrapper.text()).not.toContain('Este convite já foi usado')
  })
})
