<script setup lang="ts">
import { useId } from 'vue'

import BaseSelect from '@/shared/ui/BaseSelect.vue'
import {
  DEADLINE_FILTER_LABELS,
  type DeadlineFilter,
  type QueueSort,
} from '@/features/requests/composables/useRequestQueue'
import type { SelectOption } from '@/shared/ui/types'

/**
 * O recorte da fila.
 *
 * A situação do prazo fica em botões, e não numa lista de escolha, porque é o
 * filtro usado o tempo todo e porque cada opção carrega a sua contagem — saber
 * que há duas vencidas é metade da informação.
 */
defineProps<{
  statusOptions: readonly SelectOption[]
  rightOptions: readonly SelectOption[]
  sortOptions: readonly SelectOption[]
  deadlineCounts: Record<DeadlineFilter, number>
}>()

defineEmits<{ clear: [] }>()

const search = defineModel<string>('search', { required: true })
const status = defineModel<string>('status', { required: true })
const right = defineModel<string>('right', { required: true })
const deadline = defineModel<DeadlineFilter>('deadline', { required: true })
const sort = defineModel<QueueSort>('sort', { required: true })

const searchId = useId()
const deadlineFilters = Object.keys(DEADLINE_FILTER_LABELS) as DeadlineFilter[]
</script>

<template>
  <section
    aria-label="Filtros da fila"
    class="flex flex-col gap-4 border border-line bg-surface-muted px-5 py-[18px]"
  >
    <div class="flex flex-wrap items-end gap-4">
      <div class="flex min-w-[232px] flex-1 flex-col gap-1.5">
        <label
          :for="searchId"
          class="font-label text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-soft"
        >
          Buscar
        </label>
        <input
          :id="searchId"
          v-model="search"
          type="search"
          placeholder="Protocolo ou nome do titular"
          class="h-[46px] border border-field-line bg-surface px-[13px] text-[15px] text-ink"
        >
      </div>

      <BaseSelect
        v-model="status"
        label="Estado"
        :options="statusOptions"
        class="min-w-[208px] flex-1"
      />
      <BaseSelect
        v-model="right"
        label="Direito exercido"
        :options="rightOptions"
        class="min-w-[232px] flex-1"
      />
      <BaseSelect
        v-model="sort"
        label="Ordenar por"
        :options="sortOptions"
        class="min-w-[232px] flex-1"
      />
    </div>

    <div class="flex flex-wrap items-center gap-4 border-t border-line pt-3.5">
      <p
        id="rotulo-prazo"
        class="font-label text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-soft"
      >
        Situação do prazo
      </p>
      <div
        role="group"
        aria-labelledby="rotulo-prazo"
        class="flex flex-wrap gap-2"
      >
        <button
          v-for="option in deadlineFilters"
          :key="option"
          type="button"
          :aria-pressed="deadline === option"
          class="flex items-center gap-2 border px-[15px] py-2.5 text-sm font-semibold"
          :class="
            deadline === option
              ? 'border-ink bg-ink text-white'
              : 'border-field-line bg-surface text-ink hover:border-brand'
          "
          @click="deadline = option"
        >
          <span>{{ DEADLINE_FILTER_LABELS[option] }}</span>
          <span
            class="font-label text-[13px] font-bold"
            :class="deadline === option ? 'text-ink-on-dark' : 'text-ink-muted'"
          >{{ deadlineCounts[option] }}</span>
        </button>
      </div>

      <button
        type="button"
        class="ml-auto py-1.5 text-sm text-brand underline hover:text-brand-strong"
        @click="$emit('clear')"
      >
        Limpar filtros
      </button>
    </div>
  </section>
</template>
