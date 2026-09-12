import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

import InviteMemberDialog from '../InviteMemberDialog.vue'
import { resetInvites } from '@/features/auth/services/inviteService'
import type { Invite } from '@/features/auth/types/invite'

vi.mock('@/features/auth/services/fakeNetwork', () => ({ delay: () => Promise.resolve() }))

async function render() {
  const wrapper = mount(InviteMemberDialog, {
    attachTo: document.body,
    props: {
      open: false,
      by: { name: 'Helena Prado Vasconcelos', email: 'helena.vasconcelos@meridianosaude.org.br' },
      linkOf: (invite: Invite) => `https://portal.test/convite/${invite.token}`,
    },
  })
  await wrapper.setProps({ open: true })
  return wrapper
}

const body = () => document.body

async function submit(email: string) {
  const input = body().querySelector<HTMLInputElement>('input[type="email"]')!
  input.value = email
  input.dispatchEvent(new Event('input'))
  body().querySelector('form')!.dispatchEvent(new Event('submit'))
  await flushPromises()
}

describe('InviteMemberDialog', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    resetInvites()
  })

  it('só aceita endereço da organização', async () => {
    const wrapper = await render()

    await submit('fulano@gmail.com')

    expect(body().textContent).toContain('Só endereços @meridianosaude.org.br recebem convite')
    expect(wrapper.emitted('invited')).toBeUndefined()
  })

  it('envia e mostra o link do convite para copiar', async () => {
    const wrapper = await render()

    await submit('dora.lemos@meridianosaude.org.br')

    const [[invite]] = wrapper.emitted('invited') as [[Invite]]
    expect(body().textContent).toContain('Convite enviado')
    expect(body().querySelector('[data-convite]')!.textContent).toContain(
      `https://portal.test/convite/${invite.token}`,
    )
  })
})
