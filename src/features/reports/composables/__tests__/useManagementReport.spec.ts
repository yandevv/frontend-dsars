import { describe, it, expect, vi, beforeEach } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'

import { indicatorsOf, periodRange, toBars, useManagementReport } from '../useManagementReport'
import { fetchReport } from '@/features/reports/services/reportService'
import type { ApiRequestReport } from '@/shared/api/contracts'

function report(overrides: Partial<ApiRequestReport> = {}): ApiRequestReport {
  return {
    organizationId: 'org-1',
    period: { from: '2026-06-29', to: '2026-09-26' },
    filters: { status: null, right: null },
    generatedAt: '2026-09-26T12:00:00.000Z',
    total: 20,
    totalsByStatus: { OPEN: 5, COMPLETED: 12, CANCELLED: 3 },
    totalsByRight: { DATA_ACCESS: 8, CONSENTED_DATA_DELETION: 12 },
    averageResolutionHours: 132,
    deadline: { closed: 12, closedOnTime: 11, onTimePercentage: 91.67, openOverdue: 1 },
    satisfaction: {
      responses: 6,
      suppressed: false,
      averageRating: 4.5,
      distribution: { '1': 0, '2': 0, '3': 1, '4': 1, '5': 4 },
    },
    ...overrides,
  }
}

vi.mock('@/features/reports/services/reportService', () => ({
  fetchReport: vi.fn<(query: unknown) => Promise<ApiRequestReport>>(),
  exportReport: vi.fn<() => Promise<unknown>>(),
}))

async function mountReport() {
  const held = { value: null as ReturnType<typeof useManagementReport> | null }
  const Host = defineComponent({
    setup() {
      held.value = useManagementReport()
      return () => null
    },
  })

  mount(Host)
  await flushPromises()
  return held.value!
}

beforeEach(() => {
  vi.mocked(fetchReport).mockReset()
  vi.mocked(fetchReport).mockResolvedValue(report())
})

describe('indicadores', () => {
  it('lê os quatro números da apuração do servidor', () => {
    const [total, average, onTime, satisfaction] = indicatorsOf(report())

    expect(total).toMatchObject({ value: '20', note: '12 já concluídas' })
    expect(average).toMatchObject({ value: '5,5', unit: 'dias' })
    expect(onTime).toMatchObject({ value: '92%', note: '11 de 12 dentro do prazo de cada pedido' })
    expect(satisfaction).toMatchObject({ value: '4,5', unit: 'de 5' })
  })

  it('esconde a média de satisfação quando o servidor a suprime', () => {
    const [, , , satisfaction] = indicatorsOf(
      report({
        satisfaction: { responses: 2, suppressed: true, averageRating: null, distribution: null },
      }),
    )

    expect(satisfaction).toMatchObject({ value: '—', note: '2 respostas anônimas' })
  })

  it('não inventa média sem requisição concluída', () => {
    const [, average, onTime] = indicatorsOf(
      report({
        averageResolutionHours: null,
        deadline: { closed: 0, closedOnTime: 0, onTimePercentage: null, openOverdue: 0 },
      }),
    )

    expect(average!.value).toBe('—')
    expect(onTime!.value).toBe('—')
  })

  it('ordena as barras pelo total e calcula a participação', () => {
    const bars = toBars([
      { label: 'A', total: 1, color: 'x' },
      { label: 'B', total: 3, color: 'x' },
    ])

    expect(bars.map((bar) => [bar.label, bar.share, bar.width])).toEqual([
      ['B', '75%', '100%'],
      ['A', '25%', '33%'],
    ])
  })
})

describe('período', () => {
  const now = new Date(2026, 8, 26, 12)

  it('traduz cada período em primeiro e último dia', () => {
    expect(periodRange('ultimos-30', { from: '', to: '' }, now)).toEqual({
      from: '2026-08-28',
      to: '2026-09-26',
    })
    expect(periodRange('mes-anterior', { from: '', to: '' }, now)).toEqual({
      from: '2026-08-01',
      to: '2026-08-31',
    })
    expect(periodRange('este-ano', { from: '', to: '' }, now).from).toBe('2026-01-01')
    expect(periodRange('personalizado', { from: '2026-03-01', to: '2026-03-31' }, now)).toEqual({
      from: '2026-03-01',
      to: '2026-03-31',
    })
  })
})

describe('useManagementReport', () => {
  it('pede a apuração e monta os gráficos', async () => {
    const view = await mountReport()

    expect(view.loading.value).toBe(false)
    expect(view.byStatus.value[0]).toMatchObject({ label: 'Concluída', total: 12 })
    expect(view.byRight.value.map((bar) => bar.label)).toContain('Acesso aos dados')
    expect(view.lateCount.value).toBe(1)
    expect(view.responseRate.value).toBe('50%')
    expect(view.satisfactionVisible.value).toBe(true)
  })

  it('pede de novo, com o recorte na query, quando um filtro muda', async () => {
    const view = await mountReport()

    view.status.value = 'concluida'
    view.right.value = 'II'
    await nextTick()
    await flushPromises()

    expect(vi.mocked(fetchReport).mock.lastCall![0]).toMatchObject({
      status: ['COMPLETED'],
      right: ['DATA_ACCESS'],
    })
  })

  it('mostra a recusa do servidor em vez de números vazios', async () => {
    vi.mocked(fetchReport).mockRejectedValueOnce(new Error('fora do ar'))
    const view = await mountReport()

    expect(view.error.value).not.toBe('')
    expect(view.empty.value).toBe(false)
  })
})
