import { describe, it, expect, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

import InviteMemberDialog from '../InviteMemberDialog.vue'
import { resetTeam } from '@/features/team/services/teamService'
import { startSession } from '@/features/auth/composables/useSession'
import { mockApi, problem, route } from '@/test/api'
import type { Invite } from '@/features/auth/types/invite'

async function render() {
  const wrapper = mount(InviteMemberDialog, {
    attachTo: document.body,
    props: {
      open: false,
      by: { name: 'Helena Prado Vasconcelos', email: 'helena.vasconcelos@meridianosaude.org.br' },
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
    resetTeam()
    startSession({
      id: 'conta-helena',
      name: 'Helena Prado Vasconcelos',
      email: 'helena.vasconcelos@meridianosaude.org.br',
      role: 'encarregado',
      emailConfirmed: true,
      organizationId: 'org-1',
    })
  })

  it('envia o convite e diz que o link chega por e-mail', async () => {
    mockApi([
      route('POST', '/organizations/org-1/invites', {
        status: 202,
        body: { expiresAt: '2026-10-03T12:00:00.000Z' },
      }),
    ])
    const wrapper = await render()

    await submit('dora.lemos@meridianosaude.org.br')

    const [[invite]] = wrapper.emitted('invited') as [[Invite]]
    expect(invite.email).toBe('dora.lemos@meridianosaude.org.br')
    expect(body().textContent).toContain('Convite enviado')
    expect(body().textContent).toContain('O link nominal chega por e-mail')
  })

  it('mostra a recusa do servidor no próprio campo', async () => {
    mockApi([
      route(
        'POST',
        '/organizations/org-1/invites',
        problem(409, 'Este endereço já responde como encarregado desta organização.'),
      ),
    ])
    const wrapper = await render()

    await submit('dora.lemos@meridianosaude.org.br')

    expect(body().textContent).toContain('já responde como encarregado')
    expect(wrapper.emitted('invited')).toBeUndefined()
  })
})
