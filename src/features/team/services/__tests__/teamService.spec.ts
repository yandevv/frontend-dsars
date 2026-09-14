import { describe, it, expect, beforeEach } from 'vitest'

import {
  TeamRuleError,
  fetchTeam,
  inviteMember,
  inviteStatus,
  resendInvite,
  resetTeam,
} from '../teamService'
import { startSession } from '@/features/auth/composables/useSession'
import { mockApi, problem, route } from '@/test/api'

const HELENA = { name: 'Helena Prado Vasconcelos', email: 'helena.vasconcelos@meridianosaude.org.br' }
const EXPIRES = '2026-10-03T12:00:00.000Z'

describe('teamService', () => {
  beforeEach(() => {
    resetTeam()
    startSession({
      id: 'conta-helena',
      name: HELENA.name,
      email: HELENA.email,
      role: 'encarregado',
      emailConfirmed: true,
      organizationId: 'org-1',
    })
  })

  it('lista as pessoas e os convites que ainda não viraram vínculo', async () => {
    const { members, invites } = await fetchTeam()

    expect(members).toHaveLength(3)
    expect(invites.map((invite) => inviteStatus(invite)).sort()).toEqual(['pendente', 'vencido'])
  })

  it('envia o convite pela API da organização e o mostra na lista', async () => {
    const { calls } = mockApi([
      route('POST', '/organizations/org-1/invites', { status: 202, body: { expiresAt: EXPIRES } }),
    ])

    const invite = await inviteMember(
      { email: 'Dora.Lemos@meridianosaude.org.br', jobTitle: 'Apoio jurídico' },
      HELENA,
    )

    expect(calls[0]!.body).toEqual({ email: 'dora.lemos@meridianosaude.org.br' })
    expect(invite).toMatchObject({ email: 'dora.lemos@meridianosaude.org.br', expiresAt: EXPIRES })
    const { invites } = await fetchTeam()
    expect(invites[0]!.email).toBe('dora.lemos@meridianosaude.org.br')
  })

  it('recusa endereço malformado e pessoa que já é da equipe, sem chamar a API', async () => {
    const { calls } = mockApi([])
    const attempt = (email: string) => inviteMember({ email, jobTitle: 'Apoio jurídico' }, HELENA)

    await expect(attempt('sem-arroba')).rejects.toThrow(new TeamRuleError('email-invalido'))
    await expect(attempt('beatriz.falcao@meridianosaude.org.br')).rejects.toThrow(
      new TeamRuleError('ja-e-membro'),
    )
    expect(calls).toHaveLength(0)
  })

  it('reenviar é convidar de novo, substituindo o convite anterior na lista', async () => {
    mockApi([
      route('POST', '/organizations/org-1/invites', { status: 202, body: { expiresAt: EXPIRES } }),
    ])
    const { invites } = await fetchTeam()
    const expired = invites.find((invite) => inviteStatus(invite) === 'vencido')!

    const renewed = await resendInvite(expired, HELENA)

    expect(inviteStatus(renewed)).toBe('pendente')
    const after = await fetchTeam()
    expect(after.invites.filter((invite) => invite.email === expired.email)).toHaveLength(1)
  })

  it('repassa a recusa do servidor', async () => {
    mockApi([
      route(
        'POST',
        '/organizations/org-1/invites',
        problem(409, 'Este endereço já responde como encarregado desta organização.'),
      ),
    ])

    await expect(
      inviteMember({ email: 'dora@meridianosaude.org.br', jobTitle: 'Apoio jurídico' }, HELENA),
    ).rejects.toMatchObject({ status: 409 })
  })
})
