import { describe, it, expect } from 'vitest'

import {
  ConfirmationError,
  confirmEmail,
  confirmEmailChange,
  lastConfirmationSentAt,
  recordConfirmationSent,
  resendConfirmation,
} from '../emailConfirmationService'
import { createAccount } from '../accountService'
import { mockApi, problem, route } from '@/test/api'

const FIVE_MINUTES = 5 * 60 * 1000
const INVALID = 'Este link de confirmação não é mais válido. Solicite o envio de um novo.'

describe('emailConfirmationService', () => {
  it('o cadastro envia os dois aceites e registra o primeiro envio do link', async () => {
    const { calls } = mockApi([route('POST', '/auth/register', { status: 202, body: {} })])

    await createAccount({ name: ' Ana Souza ', email: 'Ana.Souza@exemplo.com.br', password: 'x' })

    expect(calls[0]!.body).toEqual({
      fullName: 'Ana Souza',
      email: 'ana.souza@exemplo.com.br',
      password: 'x',
      passwordConfirmation: 'x',
      acceptedTerms: true,
      acceptedPrivacyNotice: true,
    })
    expect(lastConfirmationSentAt('Ana.Souza@exemplo.com.br')).toBeDefined()
  })

  it('recusa reenviar antes do intervalo mínimo, sem chamar o servidor', async () => {
    const { calls } = mockApi([])
    const start = Date.UTC(2026, 8, 25, 10, 0, 0)
    recordConfirmationSent('bia@exemplo.com.br', start)

    const refusal = await resendConfirmation('bia@exemplo.com.br', start + 60_000).catch(
      (error: unknown) => error,
    )

    expect(refusal).toBeInstanceOf(ConfirmationError)
    expect((refusal as ConfirmationError).reason).toBe('intervalo')
    expect((refusal as ConfirmationError).detail?.retryAt).toBe(
      new Date(start + FIVE_MINUTES).toISOString(),
    )
    expect(calls).toHaveLength(0)
  })

  it('reenvia depois do intervalo e recomeça a contagem', async () => {
    const { calls } = mockApi([route('POST', '/auth/confirm-email/resend', { status: 202, body: {} })])
    const start = Date.UTC(2026, 8, 25, 11, 0, 0)
    recordConfirmationSent('caio@exemplo.com.br', start)

    const { sentAt } = await resendConfirmation('caio@exemplo.com.br', start + FIVE_MINUTES)

    expect(calls[0]!.body).toEqual({ email: 'caio@exemplo.com.br' })
    expect(sentAt).toBe(new Date(start + FIVE_MINUTES).toISOString())
    expect(lastConfirmationSentAt('caio@exemplo.com.br')).toBe(start + FIVE_MINUTES)
  })

  it('confirma o cadastro pelo link', async () => {
    const { calls } = mockApi([route('POST', '/auth/confirm-email', { message: 'ok' })])

    await expect(confirmEmail('ficha-valida')).resolves.toEqual({ kind: 'cadastro' })
    expect(calls[0]!.body).toEqual({ token: 'ficha-valida' })
  })

  it('trata link vencido, usado ou inexistente da mesma forma', async () => {
    mockApi([route('POST', '/auth/confirm-email', problem(400, INVALID))])

    await expect(confirmEmail('ficha-velha')).rejects.toMatchObject({ reason: 'invalido' })
  })

  it('confirma a troca de e-mail e devolve o endereço novo', async () => {
    mockApi([
      route('POST', '/me/email-change/confirm', {
        message: 'Endereço de e-mail alterado.',
        email: 'nova@exemplo.com.br',
      }),
    ])

    await expect(confirmEmailChange('ficha')).resolves.toEqual({
      kind: 'troca',
      email: 'nova@exemplo.com.br',
    })
  })
})
