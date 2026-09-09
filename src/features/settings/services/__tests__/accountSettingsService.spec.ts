import { describe, it, expect, vi } from 'vitest'

import {
  ProfileError,
  cancelEmailChange,
  fetchProfile,
  requestEmailChange,
  updateProfile,
} from '../accountSettingsService'
import { lastConfirmationSentAt } from '@/features/auth/services/emailConfirmationService'

vi.mock('@/features/auth/services/fakeNetwork', () => ({ delay: () => Promise.resolve() }))

const TITULAR = 'titular@exemplo.com.br'
const PASSWORD = 'SenhaSegura!123'

describe('accountSettingsService', () => {
  it('devolve o cadastro da conta, com o documento completo', async () => {
    const profile = await fetchProfile(TITULAR)

    expect(profile).toMatchObject({ name: 'Marina Torres de Almeida', document: '476.201.789-04' })
  })

  it('atualiza o nome sem espaços sobrando e recusa nome sem sobrenome', async () => {
    const updated = await updateProfile(TITULAR, 'name', '  Marina   Torres  Almeida ')
    expect(updated.name).toBe('Marina Torres Almeida')

    await expect(updateProfile(TITULAR, 'name', 'Marina')).rejects.toMatchObject({
      refusal: 'nome-invalido',
    })
  })

  it('formata o telefone e recusa número sem DDD', async () => {
    const updated = await updateProfile(TITULAR, 'phone', '16981102233')
    expect(updated.phone).toBe('(16) 98110-2233')

    await expect(updateProfile(TITULAR, 'phone', '98110-2233')).rejects.toBeInstanceOf(ProfileError)
  })

  it('deixa a troca de e-mail pendente, sem mudar o e-mail atual, e envia o link', async () => {
    const profile = await requestEmailChange(TITULAR, {
      newEmail: 'Marina.Almeida@Exemplo.com.br',
      password: PASSWORD,
    })

    expect(profile.email).toBe(TITULAR)
    expect(profile.pendingEmail).toBe('marina.almeida@exemplo.com.br')
    expect(lastConfirmationSentAt('marina.almeida@exemplo.com.br')).toBeDefined()

    const cancelled = await cancelEmailChange(TITULAR)
    expect(cancelled.pendingEmail).toBeUndefined()
  })

  it('exige a senha atual e um endereço diferente para trocar o e-mail', async () => {
    await expect(
      requestEmailChange(TITULAR, { newEmail: 'outro@exemplo.com.br', password: 'errada' }),
    ).rejects.toMatchObject({ refusal: 'senha-incorreta' })
    await expect(
      requestEmailChange(TITULAR, { newEmail: TITULAR, password: PASSWORD }),
    ).rejects.toMatchObject({ refusal: 'email-igual' })
    await expect(
      requestEmailChange(TITULAR, { newEmail: 'sem-arroba', password: PASSWORD }),
    ).rejects.toMatchObject({ refusal: 'email-invalido' })
  })

  it('não cancela troca que não existe', async () => {
    await expect(cancelEmailChange('helena.vasconcelos@meridianosaude.org.br')).rejects.toMatchObject({
      refusal: 'sem-troca-pendente',
    })
  })
})
