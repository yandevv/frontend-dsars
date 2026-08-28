<script setup lang="ts">
import { useId } from 'vue'

import type { SelectOption } from '@/shared/ui/types'

/**
 * Lista de escolha dos filtros.
 *
 * A seta é desenhada por nós porque `appearance: none` apaga a do sistema — é
 * o que o design faz para que os filtros tenham a mesma altura e a mesma borda
 * dos campos de busca ao lado.
 */
const { label, options, disabled = false } = defineProps<{
  label: string
  options: readonly SelectOption[]
  disabled?: boolean
}>()

const model = defineModel<string>({ required: true })

const selectId = useId()
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label
      :for="selectId"
      class="font-label text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-soft"
    >
      {{ label }}
    </label>
    <div class="relative">
      <select
        :id="selectId"
        v-model="model"
        :disabled="disabled"
        class="h-[46px] w-full appearance-none border border-field-line bg-surface py-3 pl-[13px] pr-9 text-[15px] text-ink"
      >
        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
      <span
        aria-hidden="true"
        class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-label text-[11px] text-ink-soft"
      >▾</span>
    </div>
  </div>
</template>
