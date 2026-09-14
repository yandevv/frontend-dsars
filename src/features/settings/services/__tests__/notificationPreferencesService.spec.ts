import { describe, it, expect } from 'vitest'

import {
  clonePreferences,
  defaultPreferences,
  fetchPreferences,
  savePreferences,
} from '../notificationPreferencesService'
import { mockApi, route } from '@/test/api'
import type { ApiEventPreference } from '@/shared/api/contracts'

const CATALOG: ApiEventPreference[] = [
  {
    eventType: 'REQUEST_COMPLETED',
    label: 'Requisição finalizada',
    description: 'Quando o encarregado conclui o atendimento.',
    channels: [
      { channel: 'IN_APP', enabled: true, mandatory: true },
      { channel: 'EMAIL', enabled: true, mandatory: true },
    ],
  },
  {
    eventType: 'SATISFACTION_SURVEY_AVAILABLE',
    label: 'Pesquisa de satisfação disponível',
    description: 'Quando a pesquisa é liberada após a finalização.',
    channels: [
      { channel: 'IN_APP', enabled: true, mandatory: false },
      { channel: 'EMAIL', enabled: false, mandatory: false },
    ],
  },
]

describe('notificationPreferencesService', () => {
  it('monta a matriz a partir do catálogo do servidor', async () => {
    mockApi([route('GET', '/me/notification-preferences', { events: CATALOG })])

    const { events, preferences } = await fetchPreferences()

    expect(events[0]!.channels.email).toEqual({ enabled: true, mandatory: true })
    expect(preferences.SATISFACTION_SURVEY_AVAILABLE).toEqual({ portal: true, email: false })
  })

  it('envia só os canais opcionais, cada um independente', async () => {
    const { calls } = mockApi([
      route('GET', '/me/notification-preferences', { events: CATALOG }),
      route('PUT', '/me/notification-preferences', { events: CATALOG }),
    ])
    const { events, preferences } = await fetchPreferences()
    const draft = clonePreferences(preferences)
    draft.SATISFACTION_SURVEY_AVAILABLE = { portal: false, email: true }

    await savePreferences(events, draft)

    expect(calls[1]!.body).toEqual({
      preferences: [
        { eventType: 'SATISFACTION_SURVEY_AVAILABLE', channel: 'IN_APP', enabled: false },
        { eventType: 'SATISFACTION_SURVEY_AVAILABLE', channel: 'EMAIL', enabled: true },
      ],
    })
  })

  it('o padrão do portal liga todos os canais de cada evento', async () => {
    mockApi([route('GET', '/me/notification-preferences', { events: CATALOG })])
    const { events } = await fetchPreferences()

    expect(defaultPreferences(events).SATISFACTION_SURVEY_AVAILABLE).toEqual({
      portal: true,
      email: true,
    })
  })
})
