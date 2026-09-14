import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'

import RequestOriginNotice from '../RequestOriginNotice.vue'
import { makeRequest } from '@/test/factories'

describe('RequestOriginNotice', () => {
  it('diz ao titular por onde o pedido chegou e quando foi registrado', () => {
    const request = {
      ...makeRequest({ registeredAt: new Date(2026, 8, 13, 9, 58).toISOString() }),
      origin: { channel: 'PHONE' as const, reference: 'atendimento 4471' },
    }

    const text = mount(RequestOriginNotice, { props: { request } }).text()

    expect(text).toContain('Registrada pela encarregada a seu pedido')
    expect(text).toContain(
      'Recebido por telefone (atendimento 4471) e registrado pela encarregada em 13/09/2026.',
    )
    expect(text).toContain('Se você não reconhece este pedido, avise a encarregada.')
  })
})
