import { describe, it, expect } from 'vitest'

import { InviteError, acceptInvite, fetchInvite } from '../inviteService'
import { mockApi, problem, route } from '@/test/api'
import type { ApiInvitePreview } from '@/shared/api/contracts'

function preview(status: ApiInvitePreview['status']): ApiInvitePreview {
  return {
    organizationName: 'Instituto Meridiano de Saúde',
    email: 'bruno@meridiano.org.br',
    role: 'DPO',
    expiresAt: '2026-10-03T12:00:00.000Z',
    status,
  }
}

describe('inviteService', () => {
  it('entrega o convite em aberto, com a organização e o endereço', async () => {
    mockApi([route('GET', '/invites/ficha', preview('PENDING'))])

    await expect(fetchInvite('ficha')).resolves.toEqual({
      token: 'ficha',
      email: 'bruno@meridiano.org.br',
      organizationName: 'Instituto Meridiano de Saúde',
      expiresAt: '2026-10-03T12:00:00.000Z',
    })
  })

  it('recusa o vencido e o já aceito, devolvendo os dados para a tela explicar', async () => {
    mockApi([
      route('GET', '/invites/vencido', preview('EXPIRED')),
      route('GET', '/invites/aceito', preview('ACCEPTED')),
    ])

    const expired = await fetchInvite('vencido').catch((error: unknown) => error)
    const accepted = await fetchInvite('aceito').catch((error: unknown) => error)

    expect(expired).toBeInstanceOf(InviteError)
    expect(expired).toMatchObject({ reason: 'expirado', invite: { token: 'vencido' } })
    expect(accepted).toMatchObject({ reason: 'utilizado' })
  })

  it('trata revogado e inexistente da mesma forma, sem citar dados', async () => {
    mockApi([
      route('GET', '/invites/revogado', preview('REVOKED')),
      route('GET', '/invites/nenhum', problem(404, 'Este convite não existe.')),
    ])

    await expect(fetchInvite('revogado')).rejects.toMatchObject({ reason: 'invalido', invite: undefined })
    await expect(fetchInvite('nenhum')).rejects.toMatchObject({ reason: 'invalido', invite: undefined })
  })

  it('aceita o convite com a conta da sessão', async () => {
    const { calls } = mockApi([
      route('POST', '/invites/ficha/accept', {
        organizationId: 'org-1',
        organizationName: 'Instituto Meridiano de Saúde',
        role: 'DPO',
      }),
    ])

    await expect(acceptInvite('ficha')).resolves.toMatchObject({ organizationId: 'org-1' })
    expect(calls[0]!.method).toBe('POST')
  })
})
