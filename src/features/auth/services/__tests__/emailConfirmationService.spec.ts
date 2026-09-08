import { describe, it, expect, vi } from 'vitest'

import {
  ConfirmationError,
  DEMO_CONFIRMATION_TOKENS,
  confirmEmail,
  isConfirmedInSession,
  lastConfirmationSentAt,
  recordConfirmationSent,
  resendConfirmation,
} from '../emailConfirmationService'
import { signIn } from '../sessionService'
import { createAccount } from '../accountService'

vi.mock('@/features/auth/services/fakeNetwork', () => ({ delay: () => Promise.resolve() }))

const FIVE_MINUTES = 5 * 60 * 1000

describe('emailConfirmationService', () => {
  it('o cadastro registra o primeiro envio do link', async () => {
    await createAccount({ name: 'Ana Souza', email: 'ana.souza@exemplo.com.br', password: 'x' })

    expect(lastConfirmationSentAt('Ana.Souza@exemplo.com.br')).toBeDefined()
  })

  it('recusa reenviar antes do intervalo mínimo e diz quando poderá', async () => {
    const start = Date.UTC(2026, 8, 25, 10, 0, 0)
    recordConfirmationSent('bia@exemplo.com.br', start)

    const refusal = await resendConfirmation('bia@exemplo.com.br', start + 60_000).catch((e) => e)

    expect(refusal).toBeInstanceOf(ConfirmationError)
    expect(refusal.reason).toBe('intervalo')
    expect(refusal.detail.retryAt).toBe(new Date(start + FIVE_MINUTES).toISOString())
  })

  it('reenvia depois do intervalo e recomeça a contagem', async () => {
    const start = Date.UTC(2026, 8, 25, 11, 0, 0)
    recordConfirmationSent('caio@exemplo.com.br', start)

    const { sentAt } = await resendConfirmation('caio@exemplo.com.br', start + FIVE_MINUTES)

    expect(sentAt).toBe(new Date(start + FIVE_MINUTES).toISOString())
    expect(lastConfirmationSentAt('caio@exemplo.com.br')).toBe(start + FIVE_MINUTES)
  })

  it('responde igual para endereço sem conta', async () => {
    await expect(resendConfirmation('ninguem@exemplo.com.br')).resolves.toHaveProperty('sentAt')
  })

  it('confirma o cadastro e libera o acesso da conta pendente', async () => {
    await expect(
      signIn({ email: 'pendente@exemplo.com.br', password: 'SenhaSegura!123' }),
    ).rejects.toMatchObject({ reason: 'email-nao-confirmado' })

    const result = await confirmEmail(DEMO_CONFIRMATION_TOKENS.cadastro)

    expect(result).toEqual({ kind: 'cadastro', email: 'pendente@exemplo.com.br' })
    expect(isConfirmedInSession('pendente@exemplo.com.br')).toBe(true)
    await expect(
      signIn({ email: 'pendente@exemplo.com.br', password: 'SenhaSegura!123' }),
    ).resolves.toMatchObject({ emailConfirmed: true })
  })

  it('confirma a troca com o endereço novo e o que ele substitui', async () => {
    await expect(confirmEmail(DEMO_CONFIRMATION_TOKENS.troca)).resolves.toMatchObject({
      kind: 'troca',
      previous: 'titular@exemplo.com.br',
    })
  })

  it('diferencia o link vencido e trata inexistente e usado da mesma forma', async () => {
    await expect(confirmEmail(DEMO_CONFIRMATION_TOKENS.expirado)).rejects.toMatchObject({
      reason: 'expirado',
      detail: { email: 'pendente@exemplo.com.br' },
    })
    await expect(confirmEmail('qualquer-coisa')).rejects.toMatchObject({ reason: 'invalido' })
  })
})
