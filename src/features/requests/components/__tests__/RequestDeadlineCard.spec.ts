import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'

import RequestDeadlineCard from '../RequestDeadlineCard.vue'
import { DEMO_REQUESTS } from '@/features/requests/data/requests'
import { addDays, daysFromNow } from '@/shared/utils/date'
import type { DataRequest } from '@/features/requests/types/request'

function requestWith(changes: Partial<DataRequest>): DataRequest {
  return { ...DEMO_REQUESTS[0]!, ...changes }
}

function render(request: DataRequest) {
  return mount(RequestDeadlineCard, { props: { request } })
}

describe('RequestDeadlineCard', () => {
  it('anuncia o prazo vencido em vermelho, com a data absoluta logo abaixo', () => {
    const wrapper = render(requestWith({ status: 'em-analise', dueAt: daysFromNow(-2) }))

    expect(wrapper.text()).toContain('Venceu há 2 dias')
    expect(wrapper.text()).toContain('Prazo legal em')
    expect(wrapper.find('section').classes()).toContain('bg-danger-wash')
  })

  it('conta quantos dias a resposta chegou antes do prazo', () => {
    const dueAt = daysFromNow(6)
    const wrapper = render(
      requestWith({ status: 'concluida', dueAt, closedAt: addDays(dueAt, -6) }),
    )

    expect(wrapper.text()).toContain('Respondida em')
    expect(wrapper.text()).toContain('Encerrada 6 dias antes do prazo legal.')
  })

  it('não cita artigo de lei na tela', () => {
    const wrapper = render(requestWith({ status: 'em-analise', dueAt: daysFromNow(9) }))

    expect(wrapper.text()).not.toMatch(/art\.\s*\d+/)
  })
})
