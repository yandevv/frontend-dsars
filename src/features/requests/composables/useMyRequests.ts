import { computed, onMounted, ref, toValue, watch, type MaybeRefOrGetter } from 'vue'

import { deadlineStatusOf } from '@/features/requests/utils/deadline'
import { isOpen } from '@/features/requests/constants/requestStatus'
import { listRequests } from '@/features/requests/services/requestService'
import { normalizeEmail } from '@/features/auth/data/accounts'
import type { DataRequest, DeadlineStatus } from '@/features/requests/types/request'

/** Os quatro números da faixa acima da lista. */
export interface MyRequestsCounts {
  open: number
  dueSoon: number
  overdue: number
  closed: number
}

/**
 * Só as requisições que a própria pessoa registrou ou que foram registradas em
 * seu nome.
 *
 * O filtro aqui é conveniência de protótipo: quem garante que ninguém veja o
 * pedido alheio é o servidor, que só devolverá as requisições do token.
 */
export function ownRequests(requests: readonly DataRequest[], email: string): DataRequest[] {
  const wanted = normalizeEmail(email)
  return requests.filter((request) => normalizeEmail(request.subject.email) === wanted)
}

const URGENCY: Record<DeadlineStatus, number> = {
  vencida: 0,
  proxima: 1,
  'em-dia': 2,
  encerrada: 3,
}

/**
 * Vencidas e a vencer sobem para o topo; entre as abertas, a que vence antes
 * vem antes. As encerradas descem, da mais recente para a mais antiga.
 */
export function sortForTitular(
  requests: readonly DataRequest[],
  now: Date = new Date(),
): DataRequest[] {
  return [...requests].sort((a, b) => {
    const urgency = URGENCY[deadlineStatusOf(a, now)] - URGENCY[deadlineStatusOf(b, now)]
    if (urgency !== 0) return urgency
    if (isOpen(a.status)) return a.dueAt.localeCompare(b.dueAt)
    return (b.closedAt ?? b.dueAt).localeCompare(a.closedAt ?? a.dueAt)
  })
}

export function countMyRequests(
  requests: readonly DataRequest[],
  now: Date = new Date(),
): MyRequestsCounts {
  const statuses = requests.map((request) => deadlineStatusOf(request, now))
  return {
    open: statuses.filter((status) => status !== 'encerrada').length,
    dueSoon: statuses.filter((status) => status === 'proxima').length,
    overdue: statuses.filter((status) => status === 'vencida').length,
    closed: statuses.filter((status) => status === 'encerrada').length,
  }
}

/**
 * A seleção sobrevive à ida até o detalhe e à volta: quem marcou três linhas
 * para abrir em abas não deveria reencontrar a lista desmarcada.
 */
const selection = ref<string[]>([])
let selectionOwner = ''

/** A lista do titular: o que é dele, em que ordem e o que está marcado. */
export function useMyRequests(email: MaybeRefOrGetter<string>) {
  const all = ref<readonly DataRequest[]>([])
  const loading = ref(true)

  const requests = computed(() => sortForTitular(ownRequests(all.value, toValue(email))))
  const counts = computed(() => countMyRequests(requests.value))

  /** Concluídas e canceladas não entram em ação em lote: já estão encerradas. */
  const selectable = computed(() => requests.value.filter((request) => isOpen(request.status)))

  /**
   * Busca a lista de novo. `quiet` atualiza sem trocar a tabela pelo esqueleto —
   * depois de um cancelamento a pessoa quer ver a linha mudar de estado, não a
   * lista sumir e voltar.
   */
  async function reload({ quiet = false }: { quiet?: boolean } = {}) {
    if (!quiet) loading.value = true
    try {
      all.value = [...(await listRequests())]
    } finally {
      loading.value = false
    }
  }

  // Outra conta na mesma aba não herda a seleção de quem saiu.
  watch(
    () => toValue(email),
    (current) => {
      if (current !== selectionOwner) selection.value = []
      selectionOwner = current
    },
    { immediate: true },
  )

  // Uma requisição que deixou de estar aberta sai da seleção sozinha.
  watch(selectable, (open) => {
    selection.value = selection.value.filter((id) => open.some((request) => request.id === id))
  })

  onMounted(() => reload())

  return { requests, counts, selectable, selected: selection, loading, reload }
}
