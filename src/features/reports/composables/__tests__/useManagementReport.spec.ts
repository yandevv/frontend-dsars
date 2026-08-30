import { describe, it, expect, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'

import { MIN_SURVEY_RESPONSES } from '@/features/reports/constants/reportPolicy'
import { useManagementReport } from '../useManagementReport'

vi.mock('@/features/auth/services/fakeNetwork', () => ({ delay: () => Promise.resolve() }))

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

describe('useManagementReport', () => {
  it('apura sobre a base inteira, fila viva incluída', async () => {
    const report = await mountReport()

    expect(report.records.value.length).toBeGreaterThan(90)
    expect(report.loading.value).toBe(false)
  })

  it('conta o tempo médio só sobre requisições concluídas', async () => {
    const report = await mountReport()

    report.status.value = 'cancelada'
    await nextTick()

    // Nenhuma cancelada tem resposta, então não há média a exibir.
    expect(report.indicators.value[1]?.value).toBe('—')
  })

  it('esconde a satisfação quando há poucas respostas para manter o anonimato', async () => {
    const report = await mountReport()

    report.period.value = 'mes-anterior'
    report.right.value = 'IX'
    await nextTick()

    expect(report.ratings.value.length).toBeLessThan(MIN_SURVEY_RESPONSES)
    expect(report.satisfactionVisible.value).toBe(false)
    expect(report.indicators.value[3]?.value).toBe('—')
  })

  it('mostra a satisfação quando o recorte é largo o bastante', async () => {
    const report = await mountReport()

    report.period.value = 'este-ano'
    await nextTick()

    expect(report.ratings.value.length).toBeGreaterThanOrEqual(MIN_SURVEY_RESPONSES)
    expect(report.satisfactionVisible.value).toBe(true)
  })

  it('soma 100% na composição por estado', async () => {
    const report = await mountReport()

    const total = report.byStatus.value.reduce((sum, bar) => sum + bar.total, 0)
    expect(total).toBe(report.filtered.value.length)
  })

  it('devolve base determinística: dois cálculos dão o mesmo número', async () => {
    const first = await mountReport()
    const second = await mountReport()

    expect(second.filtered.value.length).toBe(first.filtered.value.length)
    expect(second.indicators.value[1]?.value).toBe(first.indicators.value[1]?.value)
  })

  it('avisa quando o recorte não tem registro nenhum', async () => {
    const report = await mountReport()

    report.period.value = 'mes-anterior'
    report.right.value = 'IX'
    report.status.value = 'cancelada'
    await nextTick()

    expect(report.filtered.value).toHaveLength(0)
    expect(report.empty.value).toBe(true)
  })

  it('volta ao recorte padrão ao limpar', async () => {
    const report = await mountReport()

    report.period.value = 'este-ano'
    report.right.value = 'II'
    report.clear()
    await nextTick()

    expect(report.period.value).toBe('ultimos-90')
    expect(report.right.value).toBe('todos')
  })
})
