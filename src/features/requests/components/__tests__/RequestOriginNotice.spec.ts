import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'

import RequestOriginNotice from '../RequestOriginNotice.vue'
import { DEMO_REQUESTS } from '@/features/requests/data/requests'

describe('RequestOriginNotice', () => {
  it('diz ao titular por onde o pedido chegou e quem o registrou', () => {
    const request = {
      ...DEMO_REQUESTS[0]!,
      registeredAt: new Date(2026, 8, 13, 9, 58).toISOString(),
      origin: {
        channel: 'telefone' as const,
        receivedAt: new Date(2026, 8, 11, 12).toISOString(),
        registeredBy: 'Helena Prado Vasconcelos',
      },
    }

    const text = mount(RequestOriginNotice, { props: { request } }).text()

    expect(text).toContain('Registrada pela encarregada a seu pedido')
    expect(text).toContain(
      'Recebido por telefone em 11/09/2026 e registrado por Helena Prado Vasconcelos em 13/09/2026.',
    )
    expect(text).toContain('Se você não reconhece este pedido, avise a encarregada.')
  })
})
