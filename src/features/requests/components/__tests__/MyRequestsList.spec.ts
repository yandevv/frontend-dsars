import { describe, it, expect } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'

import MyRequestsList from '../MyRequestsList.vue'
import { sortForTitular } from '@/features/requests/composables/useMyRequests'
import { titularRequests } from '@/test/factories'

const requests = sortForTitular(titularRequests())

function render(selected: string[] = []) {
  return mount(MyRequestsList, {
    props: {
      requests,
      selected,
      'onUpdate:selected': () => {},
    },
    global: { stubs: { RouterLink: RouterLinkStub } },
  })
}

function tableRow(wrapper: ReturnType<typeof render>, protocol: string) {
  return wrapper.findAll('tbody tr').find((row) => row.text().includes(protocol))!
}

describe('MyRequestsList', () => {
  it('pinta a linha pelo prazo e diz como a requisição encerrou', () => {
    const wrapper = render()

    expect(tableRow(wrapper, '2026-000418').classes()).toContain('bg-danger-wash')
    expect(tableRow(wrapper, '2026-000418').text()).toContain('Prazo era')
    expect(tableRow(wrapper, '2026-000377').text()).toContain('Encerrada pelo titular')
    expect(tableRow(wrapper, '2026-000392').text()).toMatch(/Encerrada (no prazo|com atraso)/)
  })

  it('seleciona uma requisição em andamento', async () => {
    const wrapper = render()

    await tableRow(wrapper, '2026-000447').find('input').setValue(true)

    const open = requests.find((request) => request.protocol === '2026-000447')!
    expect(wrapper.emitted('update:selected')?.[0]?.[0]).toEqual([open.id])
  })

  it('desabilita a caixa das requisições encerradas', () => {
    const wrapper = render()

    expect(tableRow(wrapper, '2026-000392').find('input').attributes('disabled')).toBeDefined()
    expect(tableRow(wrapper, '2026-000377').find('input').attributes('disabled')).toBeDefined()
    expect(tableRow(wrapper, '2026-000447').find('input').attributes('disabled')).toBeUndefined()
  })

  it('marcar todas marca só as que estão em andamento', async () => {
    const wrapper = render()

    await wrapper.find('thead input').trigger('change')

    const selected = wrapper.emitted('update:selected')?.[0]?.[0] as string[]
    expect(selected).toHaveLength(3)
  })

  it('leva cada linha ao detalhe da requisição pelo identificador', () => {
    const wrapper = render()

    const link = tableRow(wrapper, '2026-000418').findComponent(RouterLinkStub)
    expect(link.props('to')).toEqual({
      name: 'my-request-detail',
      params: { id: requests[0]!.id },
    })
  })


  it('oferece cancelar só nas requisições em andamento', async () => {
    const wrapper = render()

    const cancel = tableRow(wrapper, '2026-000447')
      .findAll('button')
      .find((button) => button.text().startsWith('Cancelar'))!
    await cancel.trigger('click')

    const [cancelled] = wrapper.emitted<[{ protocol: string }]>('cancel')![0]!
    expect(cancelled.protocol).toBe('2026-000447')
    expect(tableRow(wrapper, '2026-000392').text()).not.toContain('Cancelar')
  })
})
