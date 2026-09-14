import { describe, it, expect } from 'vitest'

import {
  fetchProfile,
  requestEmailChange,
  revealPersonalData,
  updateProfile,
} from '../accountSettingsService'
import { lastConfirmationSentAt } from '@/features/auth/services/emailConfirmationService'
import { mockApi, route } from '@/test/api'
import type { ApiAccountView } from '@/shared/api/contracts'

function view(overrides: Partial<ApiAccountView> = {}): ApiAccountView {
  return {
    id: 'conta-1',
    fullName: 'Marina Torres de Almeida',
    email: 'marina@exemplo.com.br',
    emailVerified: true,
    memberships: [],
    passwordSet: true,
    createdAt: '2026-01-10T12:00:00.000Z',
    document: { type: 'CPF', masked: '•••.•••.789-••', verified: true },
    phone: { masked: '(••) •••••-3071' },
    pendingEmailChange: null,
    ...overrides,
  }
}

describe('accountSettingsService', () => {
  it('lê os dados já mascarados pelo servidor', async () => {
    mockApi([route('GET', '/me', view())])

    await expect(fetchProfile()).resolves.toEqual({
      name: 'Marina Torres de Almeida',
      email: 'marina@exemplo.com.br',
      documentMasked: '•••.•••.789-••',
      documentType: 'CPF',
      documentVerified: true,
      phoneMasked: '(••) •••••-3071',
      pendingEmail: undefined,
      passwordSet: true,
    })
  })

  it('altera nome e telefone pelo PATCH da conta', async () => {
    const { calls } = mockApi([route('PATCH', '/me', view({ fullName: 'Marina Torres' }))])

    const name = await updateProfile('name', '  Marina Torres ')
    await updateProfile('phone', '(16) 99482-3071')

    expect(name.name).toBe('Marina Torres')
    expect(calls.map((call) => call.body)).toEqual([
      { fullName: 'Marina Torres' },
      { phone: '(16) 99482-3071' },
    ])
  })

  it('pede a troca de e-mail e passa a mostrar a pendência', async () => {
    mockApi([
      route('POST', '/me/email-change', { message: 'ok' }),
      route(
        'GET',
        '/me',
        view({ pendingEmailChange: { newEmail: 'nova@exemplo.com.br', expiresAt: '2026-09-27' } }),
      ),
    ])

    const profile = await requestEmailChange('Nova@Exemplo.com.br')

    expect(profile.pendingEmail).toBe('nova@exemplo.com.br')
    expect(lastConfirmationSentAt('nova@exemplo.com.br')).toBeTypeOf('number')
  })

  it('revela um dado de cada vez, pedido ao servidor', async () => {
    const { calls } = mockApi([
      route('POST', '/me/personal-data/reveal', (call) =>
        (call.body as { fields: string[] }).fields[0] === 'document'
          ? { document: { type: 'CPF', value: '476.201.789-04' }, phone: null }
          : { document: null, phone: '(16) 99482-3071' },
      ),
    ])

    await expect(revealPersonalData('document')).resolves.toBe('476.201.789-04')
    await expect(revealPersonalData('phone')).resolves.toBe('(16) 99482-3071')
    expect(calls[0]!.body).toEqual({ fields: ['document'] })
  })
})
