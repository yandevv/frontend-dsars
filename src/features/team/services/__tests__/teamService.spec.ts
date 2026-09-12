import { describe, it, expect, vi, beforeEach } from 'vitest'

import {
  TeamRuleError,
  fetchTeam,
  inviteMember,
  inviteStatus,
  resendInvite,
  revokeMemberInvite,
} from '../teamService'
import { InviteError, fetchInvite, resetInvites } from '@/features/auth/services/inviteService'
import { listAuditEntries, resetAudit } from '@/features/audit/services/auditService'
import { DEMO_REQUESTS } from '@/features/requests/data/requests'
import { isOpen } from '@/features/requests/constants/requestStatus'

vi.mock('@/features/auth/services/fakeNetwork', () => ({ delay: () => Promise.resolve() }))

const HELENA = { name: 'Helena Prado Vasconcelos', email: 'helena.vasconcelos@meridianosaude.org.br' }

describe('teamService', () => {
  beforeEach(() => {
    resetInvites()
    resetAudit()
  })

  it('mostra a carga de cada pessoa pelas requisições em aberto', async () => {
    const { members } = await fetchTeam()
    const beatriz = members.find((member) => member.name === 'Beatriz Falcão Ribeiro')!
    const expected = DEMO_REQUESTS.filter(
      (request) => request.assignee === beatriz.name && isOpen(request.status),
    ).length

    expect(members).toHaveLength(3)
    expect(beatriz.open).toBe(expected)
  })

  it('lista os convites que ainda não viraram conta', async () => {
    const { invites } = await fetchTeam()

    expect(invites.map((invite) => inviteStatus(invite)).sort()).toEqual(['pendente', 'vencido'])
  })

  it('convida alguém da organização com um link que funciona', async () => {
    const invite = await inviteMember(
      { email: 'Dora.Lemos@meridianosaude.org.br', jobTitle: 'Apoio jurídico' },
      HELENA,
    )

    expect(invite.email).toBe('dora.lemos@meridianosaude.org.br')
    expect(invite.role).toBe('encarregado')
    expect(inviteStatus(invite)).toBe('pendente')
    await expect(fetchInvite(invite.token)).resolves.toMatchObject({ email: invite.email })

    const [latest] = await listAuditEntries()
    expect(latest).toMatchObject({ action: 'Convite de encarregado enviado', actor: HELENA.name })
  })

  it('recusa endereço de fora, pessoa da equipe e convite repetido', async () => {
    const attempt = (email: string) => inviteMember({ email, jobTitle: 'Apoio jurídico' }, HELENA)

    await expect(attempt('alguem@gmail.com')).rejects.toThrow(new TeamRuleError('fora-da-organizacao'))
    await expect(attempt('beatriz.falcao@meridianosaude.org.br')).rejects.toThrow(
      new TeamRuleError('ja-e-membro'),
    )
    await expect(attempt('bruno.carvalho@meridianosaude.org.br')).rejects.toThrow(
      new TeamRuleError('convite-pendente'),
    )
    await expect(attempt('sem-arroba')).rejects.toThrow(new TeamRuleError('email-invalido'))
  })

  it('revoga o convite e o link deixa de funcionar', async () => {
    const { invites } = await fetchTeam()
    const pending = invites.find((invite) => inviteStatus(invite) === 'pendente')!

    await revokeMemberInvite(pending, HELENA)

    await expect(fetchInvite(pending.token)).rejects.toThrow(new InviteError('invalido'))
    const { invites: after } = await fetchTeam()
    expect(inviteStatus(after.find((invite) => invite.token === pending.token)!)).toBe('revogado')
  })

  it('reenvia um convite vencido com um link novo', async () => {
    const { invites } = await fetchTeam()
    const expired = invites.find((invite) => inviteStatus(invite) === 'vencido')!

    const renewed = await resendInvite(expired, HELENA)

    expect(renewed.token).not.toBe(expired.token)
    expect(renewed.email).toBe(expired.email)
    expect(inviteStatus(renewed)).toBe('pendente')
  })
})
