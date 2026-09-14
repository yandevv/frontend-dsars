import { describe, it, expect, vi } from 'vitest'
import { defineComponent } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'

import { countMyRequests, sortForTitular, useMyRequests } from '../useMyRequests'
import { titularRequests } from '@/test/factories'

vi.mock('@/features/requests/services/requestService', async () => {
  const { titularRequests: requests } = await import('@/test/factories')
  return { listMyRequests: () => Promise.resolve(requests()) }
})

const TITULAR = 'titular@exemplo.com.br'

async function mountList(email: string) {
  const result = { value: null as ReturnType<typeof useMyRequests> | null }
  const Host = defineComponent({
    setup() {
      result.value = useMyRequests(email)
      return () => null
    },
  })
  const wrapper = mount(Host)
  await flushPromises()
  return { list: result.value!, wrapper }
}

describe('sortForTitular', () => {
  it('põe vencidas e a vencer no topo e as encerradas no fim', () => {
    const sorted = sortForTitular(titularRequests())

    expect(sorted.map((request) => request.protocol)).toEqual([
      '2026-000418', // vencida
      '2026-000444', // vence em 3 dias
      '2026-000447', // em dia
      '2026-000392', // concluída
      '2026-000377', // cancelada, encerrada antes
    ])
  })
})

describe('countMyRequests', () => {
  it('conta andamento, prazo curto, vencidas e encerradas', () => {
    expect(countMyRequests(titularRequests())).toEqual({
      open: 3,
      dueSoon: 1,
      overdue: 1,
      closed: 2,
    })
  })
})

describe('useMyRequests', () => {
  it('carrega a lista ordenada da conta', async () => {
    const { list } = await mountList(TITULAR)

    expect(list.loading.value).toBe(false)
    expect(list.requests.value[0]?.protocol).toBe('2026-000418')
    expect(list.selectable.value.every((request) => request.status !== 'concluida')).toBe(true)
  })

  it('mantém a seleção quando a lista é montada de novo', async () => {
    const first = await mountList(TITULAR)
    first.list.selected.value = [first.list.selectable.value[0]!.id]
    first.wrapper.unmount()

    const again = await mountList(TITULAR)
    expect(again.list.selected.value).toHaveLength(1)
  })

  it('não passa a seleção para outra conta', async () => {
    const first = await mountList(TITULAR)
    first.list.selected.value = [first.list.selectable.value[0]!.id]

    const other = await mountList('outra@exemplo.com.br')
    expect(other.list.selected.value).toEqual([])
  })
})
