import { describe, it, expect } from 'vitest'

import { changePassword, endOtherSessions, endSession, fetchSecurity } from '../securityService'
import { mockApi, problem, route } from '@/test/api'
import type { ApiSecurityView } from '@/shared/api/contracts'

const WINDOWS_CHROME =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36'

function view(sessions = 2): ApiSecurityView {
  return {
    passwordSet: true,
    passwordChangedAt: '2026-06-02T12:00:00.000Z',
    sessions: Array.from({ length: sessions }, (_, index) => ({
      id: `sessao-${index}`,
      familyId: `familia-${index}`,
      ipAddress: `177.44.12.${index}`,
      userAgent: WINDOWS_CHROME,
      createdAt: '2026-09-20T12:00:00.000Z',
      lastUsedAt: `2026-09-2${index}T12:00:00.000Z`,
      expiresAt: '2026-09-30T12:00:00.000Z',
      current: index === 0,
    })),
  }
}

describe('securityService', () => {
  it('mostra a sessão atual primeiro, com aparelho e origem legíveis', async () => {
    mockApi([route('GET', '/me/security', view(3))])

    const security = await fetchSecurity()

    expect(security.sessions[0]).toMatchObject({
      current: true,
      device: 'Chrome em Windows',
      origin: '177.44.12.0',
    })
    expect(security.sessions.slice(1).map((session) => session.id)).toEqual(['sessao-2', 'sessao-1'])
  })

  it('troca a senha e conta as sessões encerradas', async () => {
    const { calls } = mockApi([
      route('PUT', '/me/password', { revokedSessions: 1 }),
      route('GET', '/me/security', view(1)),
    ])

    const result = await changePassword({ current: 'Atual-Senha-1!', next: 'Nova-Senha-Forte9!' })

    expect(result.endedSessions).toBe(1)
    expect(result.sessions).toHaveLength(1)
    expect(calls[0]!.body).toEqual({
      currentPassword: 'Atual-Senha-1!',
      password: 'Nova-Senha-Forte9!',
      passwordConfirmation: 'Nova-Senha-Forte9!',
    })
  })

  it('repassa a recusa da senha atual', async () => {
    mockApi([route('PUT', '/me/password', problem(400, 'A senha atual não confere.'))])

    await expect(changePassword({ current: 'errada', next: 'Nova-Senha-Forte9!' })).rejects.toMatchObject({
      detail: 'A senha atual não confere.',
    })
  })

  it('encerra uma sessão ou todas as outras', async () => {
    const { calls } = mockApi([
      route('DELETE', '/me/sessions/sessao-1', { status: 204 }),
      route('DELETE', '/me/sessions', { revokedSessions: 2 }),
      route('GET', '/me/security', view(1)),
    ])

    await endSession('sessao-1')
    const result = await endOtherSessions()

    expect(result.endedSessions).toBe(2)
    expect(calls.filter((call) => call.method === 'DELETE').map((call) => call.path)).toEqual([
      '/me/sessions/sessao-1',
      '/me/sessions',
    ])
  })
})
