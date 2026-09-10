import { describe, it, expect, vi } from 'vitest'

import {
  SecurityError,
  changePassword,
  currentPasswordOf,
  endOtherSessions,
  endSession,
  fetchSecurity,
} from '../securityService'
import { signIn } from '@/features/auth/services/sessionService'
import { resetNotifications, useNotifications } from '@/features/notifications/composables/useNotifications'

vi.mock('@/features/auth/services/fakeNetwork', () => ({ delay: () => Promise.resolve() }))

const OLD = 'SenhaSegura!123'
const NEW = 'OutraSenhaForte#2026'
const titular = (email: string) => ({ role: 'titular' as const, email })

describe('securityService', () => {
  it('lista as sessões com a atual marcada e a data da última troca de senha', async () => {
    const security = await fetchSecurity('titular@exemplo.com.br')

    expect(security.sessions).toHaveLength(4)
    expect(security.sessions.filter((session) => session.current)).toHaveLength(1)
    expect(Date.parse(security.passwordChangedAt)).toBeLessThan(Date.now())
  })

  it('recusa a troca sem a senha atual certa', async () => {
    await expect(
      changePassword(titular('troca1@exemplo.com.br'), { current: 'errada', next: NEW }),
    ).rejects.toMatchObject({ refusal: 'senha-incorreta' })
  })

  it('recusa senha nova fraca ou igual à atual', async () => {
    const account = titular('troca2@exemplo.com.br')

    await expect(changePassword(account, { current: OLD, next: 'curta' })).rejects.toMatchObject({
      refusal: 'senha-fraca',
    })
    await expect(changePassword(account, { current: OLD, next: OLD })).rejects.toMatchObject({
      refusal: 'senha-repetida',
    })
  })

  it('troca a senha, encerra as outras sessões e avisa a conta', async () => {
    resetNotifications()
    const account = titular('titular@exemplo.com.br')

    const result = await changePassword(account, { current: OLD, next: NEW })

    expect(result.endedSessions).toBe(3)
    expect(result.sessions).toHaveLength(1)
    expect(result.sessions[0]?.current).toBe(true)
    expect(currentPasswordOf('titular@exemplo.com.br')).toBe(NEW)
    expect(useNotifications(account).notifications.value[0]).toMatchObject({
      type: 'Segurança da conta',
      title: 'Sua senha foi alterada',
    })
  })

  it('a senha nova passa a valer no acesso, e a antiga deixa de valer', async () => {
    await expect(signIn({ email: 'titular@exemplo.com.br', password: NEW })).resolves.toBeDefined()
    await expect(signIn({ email: 'titular@exemplo.com.br', password: OLD })).rejects.toMatchObject({
      reason: 'credenciais-invalidas',
    })
  })

  it('encerra uma sessão de outro aparelho, mas não a atual', async () => {
    const account = titular('sessoes@exemplo.com.br')
    const { sessions } = await fetchSecurity(account.email)
    const other = sessions.find((session) => !session.current)!
    const current = sessions.find((session) => session.current)!

    const after = await endSession(account, other.id)
    expect(after.sessions.map((session) => session.id)).not.toContain(other.id)

    await expect(endSession(account, current.id)).rejects.toBeInstanceOf(SecurityError)
  })

  it('encerra todas as outras de uma vez', async () => {
    const result = await endOtherSessions(titular('todas@exemplo.com.br'))

    expect(result.endedSessions).toBe(3)
    expect(result.sessions.every((session) => session.current)).toBe(true)
  })
})
