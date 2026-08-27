import { describe, it, expect, beforeEach, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'

import { useRequestQueue } from '../useRequestQueue'

vi.mock('@/features/auth/services/fakeNetwork', () => ({ delay: () => Promise.resolve() }))

let router: Router

/** O recorte vive na URL, então o composable só funciona dentro de um router. */
async function mountQueue(query: Record<string, string> = {}) {
  router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/painel/fila', name: 'request-queue', component: { template: '<div />' } }],
  })
  await router.push({ path: '/painel/fila', query })
  await router.isReady()

  const queue = { value: null as ReturnType<typeof useRequestQueue> | null }
  const Host = defineComponent({
    setup() {
      queue.value = useRequestQueue()
      return () => null
    },
  })

  mount(Host, { global: { plugins: [router] } })
  await flushPromises()
  return queue.value!
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('useRequestQueue', () => {
  it('traz a fila inteira quando nada foi filtrado', async () => {
    const queue = await mountQueue()

    expect(queue.sorted.value.length).toBe(queue.requests.value.length)
    expect(queue.isFiltered.value).toBe(false)
  })

  it('põe as vencidas no topo na ordenação padrão', async () => {
    const queue = await mountQueue()

    expect(queue.sorted.value[0]?.protocol).toBe('2026-000418')
    expect(queue.sorted.value[1]?.protocol).toBe('2026-000403')
  })

  it('lê o recorte do endereço, para que uma fila filtrada possa ser enviada a alguém', async () => {
    const queue = await mountQueue({ prazo: 'vencidas' })

    expect(queue.deadline.value).toBe('vencidas')
    expect(queue.sorted.value).toHaveLength(2)
  })

  it('escreve o recorte de volta no endereço, sem sujá-lo com os padrões', async () => {
    const queue = await mountQueue()

    queue.status.value = 'concluida'
    await nextTick()
    await flushPromises()

    expect(router.currentRoute.value.query).toEqual({ estado: 'concluida' })
  })

  it('busca por protocolo e por nome do titular', async () => {
    const queue = await mountQueue()

    queue.search.value = '000431'
    expect(queue.sorted.value).toHaveLength(1)

    queue.search.value = 'marina'
    expect(queue.sorted.value.map((request) => request.protocol)).toEqual([
      '2026-000418',
      '2026-000392',
    ])
  })

  it('conta cada situação de prazo sobre a fila inteira, não sobre o recorte', async () => {
    const queue = await mountQueue({ prazo: 'vencidas' })

    expect(queue.deadlineCounts.value.todos).toBe(queue.requests.value.length)
    expect(queue.deadlineCounts.value.vencidas).toBe(2)
  })

  it('ignora um valor de filtro que não existe em vez de mostrar fila vazia', async () => {
    const queue = await mountQueue({ estado: 'inventado' })

    expect(queue.status.value).toBe('todos')
    expect(queue.sorted.value.length).toBe(queue.requests.value.length)
  })

  it('devolve tudo ao padrão ao limpar', async () => {
    const queue = await mountQueue({ prazo: 'vencidas', busca: 'marina' })

    queue.clear()
    expect(queue.deadline.value).toBe('todos')
    expect(queue.search.value).toBe('')
    expect(queue.isFiltered.value).toBe(false)
  })
})
