import { computed, ref, watch } from 'vue'
import { useRoute, useRouter, type LocationQueryRaw } from 'vue-router'

import {
  AUDIT_OPERATIONS,
  AUDIT_OPERATION_LABELS,
} from '@/features/audit/constants/auditOperations'
import { listAuditEntries, recordAudit } from '@/features/audit/services/auditService'
import { auditToCsv } from '@/features/audit/utils/auditCsv'
import { daysUntil } from '@/shared/utils/date'
import type { AuditEntry, AuditOperation } from '@/features/audit/types/audit'

export type AuditPeriod = 'hoje' | '7-dias' | '30-dias' | 'todos'

export const AUDIT_PERIOD_LABELS: Record<AuditPeriod, string> = {
  hoje: 'Hoje',
  '7-dias': 'Últimos 7 dias',
  '30-dias': 'Últimos 30 dias',
  todos: 'Todo o período',
}

/** Dias para trás que cada período cobre, contando hoje como zero. */
const PERIOD_DAYS: Record<AuditPeriod, number> = {
  hoje: 0,
  '7-dias': 6,
  '30-dias': 29,
  todos: Infinity,
}

const DEFAULTS = {
  search: '',
  period: '30-dias' as AuditPeriod,
  actor: 'todos',
  operation: 'todos' as AuditOperation | 'todos',
}

function fromQuery<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback
}

/**
 * A trilha de auditoria da organização, com o recorte na URL — como a fila,
 * para que um recorte possa ser enviado a quem vai responder à autoridade.
 *
 * `now` é parâmetro para que os testes possam fixar o dia.
 */
export function useAuditLog(now: () => Date = () => new Date()) {
  const route = useRoute()
  const router = useRouter()

  const entries = ref<AuditEntry[]>([])
  const loading = ref(true)

  const search = ref(DEFAULTS.search)
  const period = ref<AuditPeriod>(DEFAULTS.period)
  const actor = ref(DEFAULTS.actor)
  const operation = ref<AuditOperation | 'todos'>(DEFAULTS.operation)

  const actorOptions = computed(() => [
    { value: 'todos', label: 'Todas as pessoas' },
    ...[...new Set(entries.value.map((entry) => entry.actor))]
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
      .map((name) => ({ value: name, label: name })),
  ])

  const operationOptions = [
    { value: 'todos', label: 'Todas as operações' },
    ...AUDIT_OPERATIONS.map((value) => ({ value, label: AUDIT_OPERATION_LABELS[value] })),
  ]

  const periodOptions = (Object.keys(AUDIT_PERIOD_LABELS) as AuditPeriod[]).map((value) => ({
    value,
    label: AUDIT_PERIOD_LABELS[value],
  }))

  const filtered = computed(() => {
    const term = search.value.trim().toLowerCase()
    const reach = PERIOD_DAYS[period.value]
    const today = now()

    return entries.value.filter((entry) => {
      if (-daysUntil(entry.at, today) > reach) return false
      if (actor.value !== 'todos' && entry.actor !== actor.value) return false
      if (operation.value !== 'todos' && entry.operation !== operation.value) return false
      if (term === '') return true
      return (
        entry.resource.label.toLowerCase().includes(term) ||
        entry.action.toLowerCase().includes(term) ||
        entry.detail.toLowerCase().includes(term)
      )
    })
  })

  const isFiltered = computed(() => filtered.value.length !== entries.value.length)

  /** O recorte em palavras — vai para a própria trilha quando alguém exporta. */
  const scope = computed(() =>
    [
      AUDIT_PERIOD_LABELS[period.value].toLowerCase(),
      actor.value === 'todos' ? 'todas as pessoas' : actor.value,
      operation.value === 'todos'
        ? 'todas as operações'
        : AUDIT_OPERATION_LABELS[operation.value].toLowerCase(),
      search.value.trim() ? `busca “${search.value.trim()}”` : null,
    ]
      .filter(Boolean)
      .join(' · '),
  )

  function clear() {
    search.value = DEFAULTS.search
    period.value = DEFAULTS.period
    actor.value = DEFAULTS.actor
    operation.value = DEFAULTS.operation
  }

  function readQuery() {
    const query = route.query
    search.value = typeof query.busca === 'string' ? query.busca : DEFAULTS.search
    period.value = fromQuery(
      query.periodo,
      Object.keys(AUDIT_PERIOD_LABELS) as AuditPeriod[],
      DEFAULTS.period,
    )
    actor.value = fromQuery(
      query.pessoa,
      actorOptions.value.map((option) => option.value),
      DEFAULTS.actor,
    )
    operation.value = fromQuery(query.operacao, ['todos', ...AUDIT_OPERATIONS], DEFAULTS.operation)
  }

  watch([search, period, actor, operation], () => {
    const query: LocationQueryRaw = {}
    if (search.value.trim() !== '') query.busca = search.value.trim()
    if (period.value !== DEFAULTS.period) query.periodo = period.value
    if (actor.value !== DEFAULTS.actor) query.pessoa = actor.value
    if (operation.value !== DEFAULTS.operation) query.operacao = operation.value
    void router.replace({ query })
  })

  async function load() {
    loading.value = true
    entries.value = await listAuditEntries()
    readQuery()
    loading.value = false
  }

  /**
   * O CSV do recorte. Exportar a trilha também é uma operação auditada: o
   * registro da exportação entra na trilha logo depois, com o recorte usado.
   */
  async function exportCsv(by: { actor: string }): Promise<string> {
    const csv = auditToCsv(filtered.value)
    recordAudit({
      actor: by.actor,
      actorRole: 'encarregado',
      operation: 'exportacao',
      action: 'Trilha de auditoria exportada',
      detail: `${filtered.value.length} registros em CSV · ${scope.value}.`,
      resource: { kind: 'auditoria', label: 'Trilha de auditoria' },
      origin: 'Área do encarregado',
    })
    entries.value = await listAuditEntries()
    return csv
  }

  void load()

  return {
    loading,
    entries,
    filtered,
    isFiltered,
    search,
    period,
    actor,
    operation,
    actorOptions,
    operationOptions,
    periodOptions,
    scope,
    clear,
    exportCsv,
  }
}
