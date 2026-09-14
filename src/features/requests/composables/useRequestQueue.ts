import { computed, ref, watch } from 'vue'
import { useRoute, useRouter, type LocationQueryRaw } from 'vue-router'

import { DEADLINE_ALERT_DAYS } from '@/features/requests/constants/requestPolicy'
import { REQUEST_STATUSES, REQUEST_STATUS_LABELS } from '@/features/requests/constants/requestStatus'
import { daysLeft, deadlineStatusOf } from '@/features/requests/utils/deadline'
import { findRight } from '@/shared/constants/lgpdRights'
import { listOrganizationRequests } from '@/features/requests/services/requestService'
import { messageOf } from '@/shared/api/ApiError'
import type { DataRequest, DeadlineStatus } from '@/features/requests/types/request'

export type DeadlineFilter = 'todos' | 'vencidas' | 'proximas' | 'em-dia'
export type QueueSort = 'prazo-proximo' | 'prazo-distante' | 'registro-recente' | 'registro-antigo'

const DEADLINE_FILTERS: Record<DeadlineFilter, DeadlineStatus | null> = {
  todos: null,
  vencidas: 'vencida',
  proximas: 'proxima',
  'em-dia': 'em-dia',
}

export const DEADLINE_FILTER_LABELS: Record<DeadlineFilter, string> = {
  todos: 'Todos',
  vencidas: 'Vencidas',
  proximas: `A vencer em ${DEADLINE_ALERT_DAYS} dias`,
  'em-dia': 'Em dia',
}

export const QUEUE_SORT_LABELS: Record<QueueSort, string> = {
  'prazo-proximo': 'Prazo mais próximo',
  'prazo-distante': 'Prazo mais distante',
  'registro-recente': 'Registro mais recente',
  'registro-antigo': 'Registro mais antigo',
}

/** Vencidas primeiro, depois o que vence logo: é a ordem do trabalho, não do alfabeto. */
const URGENCY: Record<DeadlineStatus, number> = {
  vencida: 0,
  proxima: 1,
  'em-dia': 2,
  encerrada: 3,
}

const DEFAULTS = {
  search: '',
  status: 'todos',
  right: 'todos',
  deadline: 'todos' as DeadlineFilter,
  sort: 'prazo-proximo' as QueueSort,
}

function fromQuery<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback
}

/**
 * A fila da organização: o que filtrar, em que ordem e o que contar.
 *
 * Os filtros vivem na URL de propósito. O design chama isso de "filtros no
 * endereço": uma fila recortada pode ser enviada a um colega sem explicação, e
 * recarregar a página não desfaz o recorte de quem estava trabalhando nele.
 */
export function useRequestQueue() {
  const route = useRoute()
  const router = useRouter()

  const requests = ref<readonly DataRequest[]>([])
  const loading = ref(true)
  const error = ref('')

  const search = ref(DEFAULTS.search)
  const status = ref(DEFAULTS.status)
  const right = ref(DEFAULTS.right)
  const deadline = ref<DeadlineFilter>(DEFAULTS.deadline)
  const sort = ref<QueueSort>(DEFAULTS.sort)

  function readQuery() {
    const query = route.query
    search.value = typeof query.busca === 'string' ? query.busca : DEFAULTS.search
    status.value = fromQuery(query.estado, ['todos', ...REQUEST_STATUSES], DEFAULTS.status)
    right.value = fromQuery(
      query.direito,
      ['todos', ...rightOptionValues.value],
      DEFAULTS.right,
    )
    deadline.value = fromQuery(
      query.prazo,
      Object.keys(DEADLINE_FILTERS) as DeadlineFilter[],
      DEFAULTS.deadline,
    )
    sort.value = fromQuery(
      query.ordem,
      Object.keys(QUEUE_SORT_LABELS) as QueueSort[],
      DEFAULTS.sort,
    )
  }

  /** Só os direitos que a fila realmente tem: filtrar por um vazio não ajuda. */
  const rightOptionValues = computed(() => [
    ...new Set(requests.value.map((request) => request.rightNumeral)),
  ])

  const rightOptions = computed(() => [
    { value: 'todos', label: 'Todos os direitos' },
    ...rightOptionValues.value.map((numeral) => ({
      value: numeral,
      label: findRight(numeral)?.requestLabel ?? numeral,
    })),
  ])

  const statusOptions = computed(() => [
    { value: 'todos', label: 'Todos os estados' },
    ...REQUEST_STATUSES.map((value) => ({ value, label: REQUEST_STATUS_LABELS[value] })),
  ])

  const sortOptions = computed(() =>
    (Object.keys(QUEUE_SORT_LABELS) as QueueSort[]).map((value) => ({
      value,
      label: QUEUE_SORT_LABELS[value],
    })),
  )

  const filtered = computed(() => {
    const term = search.value.trim().toLowerCase()

    return requests.value.filter((request) => {
      if (status.value !== 'todos' && request.status !== status.value) return false
      if (right.value !== 'todos' && request.rightNumeral !== right.value) return false

      const wanted = DEADLINE_FILTERS[deadline.value]
      if (wanted && deadlineStatusOf(request) !== wanted) return false

      if (term === '') return true
      return (
        request.protocol.toLowerCase().includes(term) ||
        request.subject.name.toLowerCase().includes(term)
      )
    })
  })

  const sorted = computed(() =>
    [...filtered.value].sort((left, rightSide) => {
      switch (sort.value) {
        case 'prazo-proximo': {
          const urgency = URGENCY[deadlineStatusOf(left)] - URGENCY[deadlineStatusOf(rightSide)]
          return urgency !== 0 ? urgency : daysLeft(left) - daysLeft(rightSide)
        }
        case 'prazo-distante':
          return daysLeft(rightSide) - daysLeft(left)
        case 'registro-recente':
          return rightSide.registeredAt.localeCompare(left.registeredAt)
        case 'registro-antigo':
          return left.registeredAt.localeCompare(rightSide.registeredAt)
      }
    }),
  )

  function countBy(situation: DeadlineStatus): number {
    return requests.value.filter((request) => deadlineStatusOf(request) === situation).length
  }

  const deadlineCounts = computed<Record<DeadlineFilter, number>>(() => ({
    todos: requests.value.length,
    vencidas: countBy('vencida'),
    proximas: countBy('proxima'),
    'em-dia': countBy('em-dia'),
  }))

  const openCount = computed(
    () => requests.value.filter((request) => deadlineStatusOf(request) !== 'encerrada').length,
  )

  const isFiltered = computed(() => sorted.value.length !== requests.value.length)

  function clear() {
    search.value = DEFAULTS.search
    status.value = DEFAULTS.status
    right.value = DEFAULTS.right
    deadline.value = DEFAULTS.deadline
    sort.value = DEFAULTS.sort
  }

  /** Só o que difere do padrão vai para a URL: endereço limpo é endereço legível. */
  watch([search, status, right, deadline, sort], () => {
    const query: LocationQueryRaw = {}
    if (search.value.trim() !== '') query.busca = search.value.trim()
    if (status.value !== DEFAULTS.status) query.estado = status.value
    if (right.value !== DEFAULTS.right) query.direito = right.value
    if (deadline.value !== DEFAULTS.deadline) query.prazo = deadline.value
    if (sort.value !== DEFAULTS.sort) query.ordem = sort.value

    void router.replace({ query })
  })

  async function load() {
    loading.value = true
    error.value = ''
    try {
      requests.value = await listOrganizationRequests()
    } catch (failure) {
      error.value = messageOf(failure)
    }
    readQuery()
    loading.value = false
  }

  void load()

  return {
    loading,
    error,
    requests,
    sorted,
    search,
    status,
    right,
    deadline,
    sort,
    statusOptions,
    rightOptions,
    sortOptions,
    deadlineCounts,
    openCount,
    isFiltered,
    clear,
  }
}
