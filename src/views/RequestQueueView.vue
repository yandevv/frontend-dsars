<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import AppShell from '@/shared/layout/AppShell.vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import QueueCards from '@/features/requests/components/QueueCards.vue'
import QueueFilters from '@/features/requests/components/QueueFilters.vue'
import QueueIndicators from '@/features/requests/components/QueueIndicators.vue'
import QueueSkeleton from '@/features/requests/components/QueueSkeleton.vue'
import QueueTable from '@/features/requests/components/QueueTable.vue'
import { DEADLINE_ALERT_DAYS, LEGAL_DEADLINE_DAYS } from '@/features/requests/constants/requestPolicy'
import { QUEUE_SORT_LABELS, useRequestQueue } from '@/features/requests/composables/useRequestQueue'
import { downloadText } from '@/shared/utils/download'
import { queueToCsv } from '@/features/requests/utils/csv'
import { useTenant } from '@/features/tenant/composables/useTenant'

/**
 * Turno 1 · Tela 10 — Fila de atendimento (RF008 / RF009).
 *
 * A tela do encarregado não oferece cancelar: cancelar uma requisição é ato do
 * titular (RF010). A única ação em lote é acessar, e é de propósito — tudo o
 * que encerra um atendimento passa pela requisição aberta, com registro em
 * auditoria.
 */
const { tenant } = useTenant()
const router = useRouter()

const queue = useRequestQueue()
const selected = ref<string[]>([])

// Mudou o recorte, a seleção deixou de fazer sentido: as linhas marcadas podem
// nem estar mais na tela.
watch(
  () => queue.sorted.value.map((request) => request.id).join(),
  () => {
    selected.value = selected.value.filter((id) =>
      queue.sorted.value.some((request) => request.id === id),
    )
  },
)

const summary = computed(() => {
  if (queue.loading.value) return 'Aplicando os filtros…'
  const total = queue.requests.value.length
  const shown = queue.sorted.value.length
  if (!queue.isFiltered.value) {
    return `${total} ${total === 1 ? 'requisição' : 'requisições'} na fila`
  }
  return `${shown} de ${total} requisições com os filtros aplicados`
})

const selectionLabel = computed(() =>
  selected.value.length === 1
    ? '1 requisição selecionada'
    : `${selected.value.length} requisições selecionadas`,
)

const openLabel = computed(() =>
  selected.value.length === 1
    ? 'Acessar a requisição'
    : `Abrir as ${selected.value.length} em abas`,
)

const empty = computed(() => !queue.loading.value && queue.sorted.value.length === 0)

function openSelected() {
  const [first, ...rest] = selected.value
  if (!first) return

  if (rest.length === 0) {
    void router.push({ name: 'request-detail', params: { id: first } })
    return
  }

  for (const id of selected.value) {
    const { href } = router.resolve({ name: 'request-detail', params: { id } })
    window.open(href, '_blank', 'noopener')
  }
}

/** Sai o que está na tela, com os filtros aplicados — não a fila inteira. */
function exportCsv() {
  downloadText('fila-de-atendimento.csv', queueToCsv(queue.sorted.value))
}
</script>

<template>
  <AppShell role="encarregado">
    <div class="mx-auto flex max-w-[1360px] flex-col gap-[22px]">
      <div class="flex flex-wrap items-start justify-between gap-8">
        <div class="flex flex-col gap-2">
          <h1 class="font-serif text-[32px] font-semibold leading-[1.15] text-ink">
            Fila de atendimento
          </h1>
          <p class="text-[15px] text-ink-soft">
            Requisições dirigidas {{ tenant.article.toLowerCase() === 'o' ? 'ao' : 'à' }}
            {{ tenant.name }} · escopo da organização controladora
          </p>
        </div>
        <QueueIndicators
          :open="queue.openCount.value"
          :overdue="queue.deadlineCounts.value.vencidas"
          :due-soon="queue.deadlineCounts.value.proximas"
        />
      </div>

      <QueueFilters
        v-model:search="queue.search.value"
        v-model:status="queue.status.value"
        v-model:right="queue.right.value"
        v-model:deadline="queue.deadline.value"
        v-model:sort="queue.sort.value"
        :status-options="queue.statusOptions.value"
        :right-options="queue.rightOptions.value"
        :sort-options="queue.sortOptions.value"
        :deadline-counts="queue.deadlineCounts.value"
        @clear="queue.clear"
      />

      <div class="flex flex-wrap items-baseline justify-between gap-5">
        <p
          aria-live="polite"
          class="text-[15px] text-ink-soft"
        >
          {{ summary }}
        </p>
        <p class="text-sm text-ink-muted">
          Ordenado por: {{ QUEUE_SORT_LABELS[queue.sort.value].toLowerCase() }}
        </p>
      </div>

      <div
        v-if="selected.length > 0"
        class="flex flex-wrap items-center justify-between gap-6 bg-ink px-5 py-3.5"
      >
        <div class="flex flex-col gap-0.5">
          <p class="text-[15px] font-semibold text-white">
            {{ selectionLabel }}
          </p>
          <p class="text-[13px] text-ink-on-dark">
            Acessar abre cada requisição com o histórico e o formulário de resposta.
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <button
            type="button"
            class="border border-white bg-white px-5 py-[13px] text-[15px] font-semibold text-ink"
            @click="openSelected"
          >
            {{ openLabel }}
          </button>
          <button
            type="button"
            class="py-1.5 text-sm text-white underline"
            @click="selected = []"
          >
            Desmarcar
          </button>
        </div>
      </div>

      <QueueSkeleton v-if="queue.loading.value" />

      <div
        v-else-if="empty"
        class="flex flex-col items-center gap-3 border border-line bg-surface-subtle px-6 py-11 text-center"
      >
        <p class="font-serif text-[22px] font-semibold text-ink">
          Nenhuma requisição com esses filtros
        </p>
        <p class="max-w-[56ch] text-[15px] leading-relaxed text-ink-soft">
          A fila tem {{ queue.requests.value.length }} requisições no total. Amplie a situação do
          prazo ou volte ao estado “Todos os estados” para ver o resto.
        </p>
        <BaseButton
          size="sm"
          @click="queue.clear"
        >
          Limpar filtros
        </BaseButton>
      </div>

      <template v-else>
        <div class="hidden xl:block">
          <QueueTable
            v-model:selected="selected"
            :requests="queue.sorted.value"
          />
        </div>
        <div class="xl:hidden">
          <QueueCards :requests="queue.sorted.value" />
        </div>
      </template>

      <div class="flex flex-wrap items-center justify-between gap-5">
        <div class="flex flex-wrap items-center gap-5">
          <p class="flex items-center gap-2 text-sm text-ink-soft">
            <span
              aria-hidden="true"
              class="h-4 w-[3px] bg-danger"
            />
            Prazo vencido
          </p>
          <p class="flex items-center gap-2 text-sm text-ink-soft">
            <span
              aria-hidden="true"
              class="h-4 w-[3px] bg-due-soon"
            />
            Vence em até {{ DEADLINE_ALERT_DAYS }} dias
          </p>
          <p class="text-sm text-ink-muted">
            Prazo legal de {{ LEGAL_DEADLINE_DAYS }} dias contados do registro (art. 19, LGPD).
          </p>
        </div>
        <BaseButton
          variant="secondary"
          size="sm"
          @click="exportCsv"
        >
          Exportar a fila em CSV
        </BaseButton>
      </div>
    </div>
  </AppShell>
</template>
