import { computed, ref } from 'vue'

import { MIN_SURVEY_RESPONSES } from '@/features/reports/constants/reportPolicy'
import { REQUEST_STATUSES, REQUEST_STATUS_LABELS } from '@/features/requests/constants/requestStatus'
import { fetchReportRecords } from '@/features/reports/services/reportService'
import { findRight } from '@/shared/constants/lgpdRights'
import type { ReportBar, ReportIndicator, ReportRecord } from '@/features/reports/types/report'
import type { RequestStatus } from '@/features/requests/types/request'

export type ReportPeriod =
  | 'ultimos-30'
  | 'ultimos-90'
  | 'mes-anterior'
  | 'este-ano'
  | 'personalizado'

const STATUS_COLORS: Record<RequestStatus, string> = {
  concluida: 'bg-brand',
  'em-analise': 'bg-chart-2',
  'aguardando-complemento': 'bg-due-soon',
  cancelada: 'bg-chart-4',
}

/** Número em português: uma casa decimal, vírgula como separador. */
function decimal(value: number): string {
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

/**
 * Os indicadores de atendimento da organização (RF028).
 *
 * Todos os números são agregados, e nenhum deles identifica titular ou
 * respondente. O corte de anonimato da satisfação está aqui, e não na tela:
 * é regra de apuração, não de exibição.
 */
export function useManagementReport() {
  const records = ref<readonly ReportRecord[]>([])
  const loading = ref(true)

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
    ...[...new Set(records.value.map((record) => record.rightNumeral))]
      .sort()
      .map((numeral) => ({
        value: numeral,
        label: findRight(numeral)?.requestLabel ?? numeral,
      })),
  ])

  const statusOptions = computed(() => [
    { value: 'todos', label: 'Todos os estados' },
    ...REQUEST_STATUSES.map((value) => ({ value, label: REQUEST_STATUS_LABELS[value] })),
  ])

  function withinPeriod(record: ReportRecord): boolean {
    const day = record.registeredAt.slice(0, 10)

    switch (period.value) {
      case 'ultimos-30':
        return day >= isoDate(new Date(Date.now() - 30 * 86_400_000))
      case 'ultimos-90':
        return day >= isoDate(new Date(Date.now() - 90 * 86_400_000))
      case 'mes-anterior':
        return day.slice(0, 7) === isoDate(previousMonth).slice(0, 7)
      case 'este-ano':
        return day.slice(0, 4) === String(new Date().getFullYear())
      case 'personalizado':
        return day >= from.value && day <= to.value
    }
  }

  const filtered = computed(() =>
    records.value.filter(
      (record) =>
        withinPeriod(record) &&
        (right.value === 'todos' || record.rightNumeral === right.value) &&
        (status.value === 'todos' || record.status === status.value),
    ),
  )

  const answered = computed(() =>
    filtered.value.filter(
      (record): record is ReportRecord & { daysToAnswer: number } =>
        record.status === 'concluida' && record.daysToAnswer !== undefined,
    ),
  )

  const onTime = computed(
    // Cada pedido contra o próprio prazo: imediato não é "no prazo" com 10 dias.
    () => answered.value.filter((record) => record.onTime).length,
  )

  const onTimePercent = computed(() =>
    answered.value.length === 0
      ? 0
      : Math.round((onTime.value / answered.value.length) * 100),
  )

  const averageDays = computed(() =>
    answered.value.length === 0
      ? 0
      : answered.value.reduce((sum, record) => sum + record.daysToAnswer, 0) /
        answered.value.length,
  )

  const ratings = computed(() =>
    filtered.value
      .map((record) => record.rating)
      .filter((rating): rating is number => rating !== undefined),
  )

  const averageRating = computed(() =>
    ratings.value.length === 0
      ? 0
      : ratings.value.reduce((sum, rating) => sum + rating, 0) / ratings.value.length,
  )

  /** Abaixo do mínimo, a média e a distribuição saem de cena (anonimato). */
  const satisfactionVisible = computed(() => ratings.value.length >= MIN_SURVEY_RESPONSES)

  const indicators = computed<ReportIndicator[]>(() => [
    {
      label: 'Requisições no período',
      value: String(filtered.value.length),
      unit: 'registradas',
      note: `${answered.value.length} já ${answered.value.length === 1 ? 'concluída' : 'concluídas'}`,
      tone: 'text-ink',
    },
    {
      label: 'Tempo médio de atendimento',
      value: answered.value.length === 0 ? '—' : decimal(averageDays.value),
      unit: answered.value.length === 0 ? '' : 'dias',
      note: 'Do registro à resposta final',
      tone: 'text-brand',
    },
    {
      label: 'Concluídas dentro do prazo',
      value: answered.value.length === 0 ? '—' : `${onTimePercent.value}%`,
      unit: '',
      note: `${onTime.value} de ${answered.value.length} dentro do prazo de cada pedido`,
      tone:
        onTimePercent.value >= 90
          ? 'text-brand'
          : onTimePercent.value >= 75
            ? 'text-due-soon-ink'
            : 'text-danger',
    },
    {
      label: 'Satisfação média',
      value: satisfactionVisible.value ? decimal(averageRating.value) : '—',
      unit: satisfactionVisible.value ? 'de 5' : '',
      note: `${ratings.value.length} respostas anônimas`,
      tone: 'text-brand',
    },
  ])

  function toBars(
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

  const byRight = computed(() =>
    toBars(
      [...new Set(records.value.map((record) => record.rightNumeral))].map((numeral) => ({
        label: findRight(numeral)?.requestLabel ?? numeral,
        total: filtered.value.filter((record) => record.rightNumeral === numeral).length,
        color: 'bg-brand',
      })),
    ),
  )

  const byStatus = computed(() =>
    toBars(
      REQUEST_STATUSES.map((value) => ({
        label: REQUEST_STATUS_LABELS[value],
        total: filtered.value.filter((record) => record.status === value).length,
        color: STATUS_COLORS[value],
      })),
    ),
  )

  const ratingDistribution = computed(() => {
    const counts = [5, 4, 3, 2, 1].map(
      (score) => ratings.value.filter((rating) => rating === score).length,
    )
    const largest = Math.max(1, ...counts)

    return [5, 4, 3, 2, 1].map((score, index) => {
      const total = counts[index] ?? 0
      return {
        label: score === 1 ? '1 estrela' : `${score} estrelas`,
        total,
        share:
          ratings.value.length === 0
            ? '0%'
            : `${Math.round((total / ratings.value.length) * 100)}%`,
        width: `${Math.round((total / largest) * 100)}%`,
        color: score >= 4 ? 'bg-brand' : score === 3 ? 'bg-chart-3' : 'bg-due-soon',
      }
    })
  })

  const responseRate = computed(() =>
    answered.value.length === 0
      ? '0%'
      : `${Math.round((ratings.value.length / answered.value.length) * 100)}%`,
  )

  const lateCount = computed(() => answered.value.length - onTime.value)

  const empty = computed(() => !loading.value && filtered.value.length === 0)

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

    const count = filtered.value.length
    return `${count} ${count === 1 ? 'requisição' : 'requisições'} · ${parts.join(' · ')}`
  })

  function clear() {
    period.value = 'ultimos-90'
    right.value = 'todos'
    status.value = 'todos'
  }

  async function load() {
    loading.value = true
    records.value = await fetchReportRecords()
    loading.value = false
  }

  void load()

  return {
    loading,
    records,
    filtered,
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
    ratings,
    ratingDistribution,
    averageRating,
    satisfactionVisible,
    responseRate,
    summary,
    empty,
    clear,
  }
}
