import { computed, ref, watch } from 'vue'

import { MIN_SURVEY_RESPONSES } from '@/features/reports/constants/reportPolicy'
import { REQUEST_STATUSES, REQUEST_STATUS_LABELS } from '@/features/requests/constants/requestStatus'
import { fetchReport, type ReportQuery } from '@/features/reports/services/reportService'
import { LGPD_RIGHTS, findRight } from '@/shared/constants/lgpdRights'
import { apiStatusOf, numeralOf, rightOf, statusOf } from '@/shared/api/enums'
import { messageOf } from '@/shared/api/ApiError'
import type { ApiRequestReport, LgpdRight } from '@/shared/api/contracts'
import type { ReportBar, ReportIndicator } from '@/features/reports/types/report'
import type { RequestStatus } from '@/features/requests/types/request'

export type ReportPeriod =
  | 'ultimos-30'
  | 'ultimos-90'
  | 'mes-anterior'
  | 'este-ano'
  | 'personalizado'

const STATUS_COLORS: Record<RequestStatus, string> = {
  concluida: 'bg-brand',
  aberta: 'bg-chart-2',
  cancelada: 'bg-chart-4',
}

/** Número em português: uma casa decimal, vírgula como separador. */
export function decimal(value: number): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function monthsAgo(months: number): Date {
  const date = new Date()
  date.setMonth(date.getMonth() - months)
  return date
}

const MONTH_NAMES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

/** O primeiro e o último dia de cada período, como a API os recebe. */
export function periodRange(
  period: ReportPeriod,
  custom: { from: string; to: string },
  now: Date = new Date(),
): { from: string; to: string } {
  const today = isoDate(now)
  switch (period) {
    case 'ultimos-30':
      return { from: isoDate(new Date(now.getTime() - 29 * 86_400_000)), to: today }
    case 'ultimos-90':
      return { from: isoDate(new Date(now.getTime() - 89 * 86_400_000)), to: today }
    case 'mes-anterior': {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const last = new Date(now.getFullYear(), now.getMonth(), 0)
      const pad = (value: number) => String(value).padStart(2, '0')
      const day = (date: Date) =>
        `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
      return { from: day(first), to: day(last) }
    }
    case 'este-ano':
      return { from: `${now.getFullYear()}-01-01`, to: today }
    case 'personalizado':
      return custom
  }
}

/** Barras proporcionais à maior, com a participação no conjunto. */
export function toBars(
  counts: readonly { label: string; total: number; color: string }[],
): ReportBar[] {
  const largest = Math.max(1, ...counts.map((item) => item.total))
  const total = counts.reduce((sum, item) => sum + item.total, 0) || 1

  return counts
    .slice()
    .sort((left, rightSide) => rightSide.total - left.total)
    .map((item) => ({
      label: item.label,
      total: item.total,
      share: `${Math.round((item.total / total) * 100)}%`,
      width: `${Math.round((item.total / largest) * 100)}%`,
      color: item.color,
    }))
}

/** Os quatro números grandes, a partir do que o servidor apurou. */
export function indicatorsOf(report: ApiRequestReport): ReportIndicator[] {
  const completed = report.totalsByStatus.COMPLETED ?? 0
  const { closed, closedOnTime, onTimePercentage } = report.deadline
  const hours = report.averageResolutionHours
  const { satisfaction } = report
  const visible = !satisfaction.suppressed && satisfaction.averageRating !== null

  return [
    {
      label: 'Requisições no período',
      value: String(report.total),
      unit: 'registradas',
      note: `${completed} já ${completed === 1 ? 'concluída' : 'concluídas'}`,
      tone: 'text-ink',
    },
    {
      label: 'Tempo médio de atendimento',
      value: hours === null ? '—' : decimal(hours / 24),
      unit: hours === null ? '' : 'dias',
      note: 'Do registro à resposta final',
      tone: 'text-brand',
    },
    {
      label: 'Concluídas dentro do prazo',
      value: onTimePercentage === null ? '—' : `${Math.round(onTimePercentage)}%`,
      unit: '',
      note: `${closedOnTime} de ${closed} dentro do prazo de cada pedido`,
      tone:
        onTimePercentage === null || onTimePercentage >= 90
          ? 'text-brand'
          : onTimePercentage >= 75
            ? 'text-due-soon-ink'
            : 'text-danger',
    },
    {
      label: 'Satisfação média',
      value: visible ? decimal(satisfaction.averageRating ?? 0) : '—',
      unit: visible ? 'de 5' : '',
      note: `${satisfaction.responses} respostas anônimas`,
      tone: 'text-brand',
    },
  ]
}

/**
 * Os indicadores de atendimento da organização (RF028).
 *
 * Todos os números são agregados pelo servidor, e nenhum deles identifica
 * titular ou respondente. Cada troca de filtro pede uma nova apuração.
 */
export function useManagementReport() {
  const report = ref<ApiRequestReport | null>(null)
  const loading = ref(true)
  const error = ref('')

  const period = ref<ReportPeriod>('ultimos-90')
  const right = ref('todos')
  const status = ref('todos')

  const previousMonth = monthsAgo(1)
  const from = ref(isoDate(monthsAgo(3)))
  const to = ref(isoDate(new Date()))

  const periodOptions = computed(() => [
    { value: 'ultimos-30', label: 'Últimos 30 dias' },
    { value: 'ultimos-90', label: 'Últimos 90 dias' },
    {
      value: 'mes-anterior',
      label: `${MONTH_NAMES[previousMonth.getMonth()]} de ${previousMonth.getFullYear()}`,
    },
    { value: 'este-ano', label: 'Este ano' },
    { value: 'personalizado', label: 'Período personalizado' },
  ])

  const rightOptions = computed(() => [
    { value: 'todos', label: 'Todos os direitos' },
    ...LGPD_RIGHTS.map((item) => ({ value: item.numeral, label: item.requestLabel })),
  ])

  const statusOptions = computed(() => [
    { value: 'todos', label: 'Todos os estados' },
    ...REQUEST_STATUSES.map((value) => ({ value, label: REQUEST_STATUS_LABELS[value] })),
  ])

  /** O recorte da tela, no formato que a API recebe. */
  const query = computed<ReportQuery>(() => ({
    ...periodRange(period.value, { from: from.value, to: to.value }),
    status: status.value === 'todos' ? undefined : [apiStatusOf(status.value as RequestStatus)],
    right: right.value === 'todos' ? undefined : [rightOf(right.value)],
  }))

  const indicators = computed(() => (report.value ? indicatorsOf(report.value) : []))

  const byRight = computed(() =>
    toBars(
      Object.entries(report.value?.totalsByRight ?? {}).map(([key, total]) => {
        const numeral = numeralOf(key as LgpdRight)
        return {
          label: findRight(numeral)?.requestLabel ?? numeral,
          total: total ?? 0,
          color: 'bg-brand',
        }
      }),
    ),
  )

  const byStatus = computed(() =>
    toBars(
      Object.entries(report.value?.totalsByStatus ?? {}).map(([key, total]) => {
        const value = statusOf(key as keyof ApiRequestReport['totalsByStatus'])
        return { label: REQUEST_STATUS_LABELS[value], total, color: STATUS_COLORS[value] }
      }),
    ),
  )

  const responseCount = computed(() => report.value?.satisfaction.responses ?? 0)
  const averageRating = computed(() => report.value?.satisfaction.averageRating ?? 0)
  const satisfactionVisible = computed(
    () =>
      !!report.value &&
      !report.value.satisfaction.suppressed &&
      responseCount.value >= MIN_SURVEY_RESPONSES,
  )

  const ratingDistribution = computed(() => {
    const distribution = report.value?.satisfaction.distribution
    const scores = [5, 4, 3, 2, 1] as const
    const counts = scores.map((score) => distribution?.[String(score) as '1'] ?? 0)
    const largest = Math.max(1, ...counts)
    const total = counts.reduce((sum, count) => sum + count, 0)

    return scores.map((score, index) => {
      const count = counts[index] ?? 0
      return {
        label: score === 1 ? '1 estrela' : `${score} estrelas`,
        total: count,
        share: total === 0 ? '0%' : `${Math.round((count / total) * 100)}%`,
        width: `${Math.round((count / largest) * 100)}%`,
        color: score >= 4 ? 'bg-brand' : score === 3 ? 'bg-chart-3' : 'bg-due-soon',
      }
    })
  })

  const responseRate = computed(() => {
    const completed = report.value?.totalsByStatus.COMPLETED ?? 0
    return completed === 0 ? '0%' : `${Math.round((responseCount.value / completed) * 100)}%`
  })

  const lateCount = computed(() =>
    report.value ? report.value.deadline.closed - report.value.deadline.closedOnTime : 0,
  )

  const empty = computed(() => !loading.value && !error.value && report.value?.total === 0)

  const summary = computed(() => {
    if (loading.value) return 'Recalculando os indicadores para este recorte…'

    const parts = [
      periodOptions.value.find((option) => option.value === period.value)?.label.toLowerCase(),
      right.value === 'todos'
        ? null
        : (findRight(right.value)?.requestLabel.toLowerCase() ?? null),
      status.value === 'todos'
        ? null
        : REQUEST_STATUS_LABELS[status.value as RequestStatus].toLowerCase(),
    ].filter(Boolean)

    const count = report.value?.total ?? 0
    return `${count} ${count === 1 ? 'requisição' : 'requisições'} · ${parts.join(' · ')}`
  })

  function clear() {
    period.value = 'ultimos-90'
    right.value = 'todos'
    status.value = 'todos'
  }

  let latest = 0
  async function load() {
    const ticket = ++latest
    loading.value = true
    error.value = ''
    try {
      const result = await fetchReport(query.value)
      // Filtros trocados enquanto a apuração corria: só a última resposta vale.
      if (ticket === latest) report.value = result
    } catch (failure) {
      if (ticket === latest) error.value = messageOf(failure)
    } finally {
      if (ticket === latest) loading.value = false
    }
  }

  watch(query, () => void load(), { deep: true })
  void load()

  return {
    loading,
    error,
    report,
    query,
    period,
    right,
    status,
    from,
    to,
    periodOptions,
    rightOptions,
    statusOptions,
    indicators,
    byRight,
    byStatus,
    lateCount,
    responseCount,
    ratingDistribution,
    averageRating,
    satisfactionVisible,
    responseRate,
    summary,
    empty,
    clear,
  }
}
