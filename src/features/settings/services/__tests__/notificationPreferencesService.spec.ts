import { describe, it, expect, vi } from 'vitest'

import { enforceLocked, fetchPreferences, savePreferences } from '../notificationPreferencesService'
import { defaultPreferences, eventsFor } from '@/features/settings/constants/notificationEvents'

vi.mock('@/features/auth/services/fakeNetwork', () => ({ delay: () => Promise.resolve() }))

describe('notificationPreferencesService', () => {
  it('começa no padrão do portal', async () => {
    expect(await fetchPreferences('nova@exemplo.com.br')).toEqual(defaultPreferences())
  })

  it('guarda cada canal de forma independente', async () => {
    const preferences = defaultPreferences()
    preferences.prazo.sms = true
    preferences.prazo.email = false

    const saved = await savePreferences('canais@exemplo.com.br', preferences)

    expect(saved.prazo).toEqual({ email: false, portal: true, sms: true })
    expect(await fetchPreferences('canais@exemplo.com.br')).toEqual(saved)
  })

  it('não deixa desligar o e-mail das comunicações obrigatórias, mesmo forçado', async () => {
    const preferences = defaultPreferences()
    preferences.transicao.email = false
    preferences.seguranca.email = false
    preferences.seguranca.sms = false

    const saved = await savePreferences('forcado@exemplo.com.br', preferences)

    expect(saved.transicao.email).toBe(true)
    expect(saved.seguranca.email).toBe(true)
    expect(saved.seguranca.sms).toBe(false)
  })

  it('enforceLocked não altera a matriz recebida', () => {
    const preferences = defaultPreferences()
    preferences.transicao.email = false

    enforceLocked(preferences)

    expect(preferences.transicao.email).toBe(false)
  })

  it('mostra a cada perfil só os eventos dele', () => {
    const titular = eventsFor('titular').map((event) => event.id)
    const encarregado = eventsFor('encarregado').map((event) => event.id)

    expect(titular).toContain('pesquisa')
    expect(titular).not.toContain('relatorio')
    expect(encarregado).toContain('relatorio')
    expect(encarregado).not.toContain('pesquisa')
  })
})
