<script setup lang="ts">
import { useId } from 'vue'

import BaseSelect from '@/shared/ui/BaseSelect.vue'
import type { AuditPeriod } from '@/features/audit/composables/useAuditLog'
import type { SelectOption } from '@/shared/ui/types'

/** O recorte da trilha: período, pessoa, tipo de operação e busca livre. */
defineProps<{
  periodOptions: readonly SelectOption[]
  actorOptions: readonly SelectOption[]
  operationOptions: readonly SelectOption[]
}>()

defineEmits<{ clear: [] }>()

const search = defineModel<string>('search', { required: true })
const period = defineModel<AuditPeriod>('period', { required: true })
const actor = defineModel<string>('actor', { required: true })
const operation = defineModel<string>('operation', { required: true })

const searchId = useId()
</script>

<template>
  <section
    aria-label="Filtros da trilha"
    class="flex flex-col gap-4 border border-line bg-surface-muted px-5 py-[18px]"
  >
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
      <div class="flex flex-col gap-1.5">
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
          placeholder="Protocolo, ação ou detalhe"
          class="h-[46px] border border-field-line bg-surface px-[13px] text-[15px] text-ink"
        >
      </div>
      <BaseSelect
        v-model="period"
        label="Período"
        :options="periodOptions"
      />
      <BaseSelect
        v-model="actor"
        label="Quem"
        :options="actorOptions"
      />
      <BaseSelect
        v-model="operation"
        label="Operação"
        :options="operationOptions"
      />
    </div>
    <div class="flex justify-end border-t border-line pt-3">
      <button
        type="button"
        class="py-1.5 text-sm text-brand underline hover:text-brand-strong"
        @click="$emit('clear')"
      >
        Limpar filtros
      </button>
    </div>
  </section>
</template>
