import { describe, it, expect, vi } from 'vitest'

import {
  InviteError,
  acceptInvite,
  fetchInvite,
} from '@/features/auth/services/inviteService'

// O atraso simulado existe para a tela ter um estado de envio; aqui só atrasaria a suíte.
vi.mock('@/features/auth/services/fakeNetwork', () => ({ delay: () => Promise.resolve() }))

describe('inviteService', () => {
  it('entrega o convite em aberto', async () => {
    const invite = await fetchInvite('convite-valido')

    expect(invite.email).toBe('bruno.carvalho@meridianosaude.org.br')
    expect(invite.role).toBe('encarregado')
  })

  it('mantém o convite em aberto válido a partir de hoje', async () => {
    const invite = await fetchInvite('convite-valido')

    // Datas fixas venceriam sozinhas e tirariam a tela do alcance do protótipo.
    expect(new Date(invite.expiresAt).getTime()).toBeGreaterThan(Date.now())
  })

  it('recusa o convite vencido e devolve os dados para a tela explicar', async () => {
    const error = await fetchInvite('convite-expirado').catch((reason: unknown) => reason)

    expect(error).toBeInstanceOf(InviteError)
    expect((error as InviteError).reason).toBe('expirado')
    expect((error as InviteError).invite?.email).toBe('carla.menezes@meridianosaude.org.br')
  })

  it('recusa o convite cuja conta já foi criada', async () => {
    const error = await fetchInvite('convite-usado').catch((reason: unknown) => reason)

    expect((error as InviteError).reason).toBe('utilizado')
    expect((error as InviteError).invite?.usedAt).toBeDefined()
  })

  it('recusa um código que não corresponde a convite nenhum, sem citar dados', async () => {
    const error = await fetchInvite('nao-existe').catch((reason: unknown) => reason)

    expect((error as InviteError).reason).toBe('invalido')
    expect((error as InviteError).invite).toBeUndefined()
  })

  it('cria a conta com o perfil do convite e com o e-mail já confirmado', async () => {
    const account = await acceptInvite({
      token: 'convite-valido',
      name: '  Bruno Carvalho de Souza  ',
      password: 'SenhaSegura!123',
    })

    expect(account).toMatchObject({
      name: 'Bruno Carvalho de Souza',
      email: 'bruno.carvalho@meridianosaude.org.br',
      role: 'encarregado',
      // O link do convite foi aberto: é a prova que o RN005 pede.
      emailConfirmed: true,
    })
  })

  it('gasta o convite: o mesmo link não serve duas vezes', async () => {
    // A aceitação do caso anterior já consumiu o token — ele vive no módulo,
    // como viverá no banco.
    const error = await fetchInvite('convite-valido').catch((reason: unknown) => reason)

    expect((error as InviteError).reason).toBe('utilizado')

    const second = await acceptInvite({
      token: 'convite-valido',
      name: 'Outra Pessoa',
      password: 'SenhaSegura!123',
    }).catch((reason: unknown) => reason)

    expect((second as InviteError).reason).toBe('utilizado')
  })
})
