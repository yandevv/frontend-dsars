<script setup lang="ts">
import { computed, ref } from 'vue'

import BaseSelect from '@/shared/ui/BaseSelect.vue'
import { REQUEST_HANDLERS } from '@/features/requests/data/team'

/**
 * Quem responde por este atendimento.
 *
 * A reatribuição fica registrada na trilha, e por isso não é um campo sempre
 * aberto: trocar de responsável é um ato, não uma preferência de exibição.
 */
const { assignee, disabled = false } = defineProps<{
  assignee?: string
  disabled?: boolean
}>()

const emit = defineEmits<{ reassign: [string] }>()

const editing = ref(false)
const chosen = ref(assignee ?? '')

const options = computed(() =>
  REQUEST_HANDLERS.map((handler) => ({ value: handler, label: handler })),
)

function confirm() {
  if (chosen.value && chosen.value !== assignee) emit('reassign', chosen.value)
  editing.value = false
}
</script>

<template>
  <section class="flex flex-col gap-3 border border-line bg-surface px-5 py-[18px]">
    <h2 class="font-label text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-soft">
      Responsável
    </h2>

    <div
      v-if="!editing"
      class="flex items-center justify-between gap-3.5"
    >
      <p class="text-base text-ink">
        {{ assignee ?? 'Sem responsável' }}
      </p>
      <button
        v-if="!disabled"
        type="button"
        class="text-[15px] font-medium text-brand underline hover:text-brand-strong"
        @click="editing = true"
      >
        Reatribuir
      </button>
    </div>

    <div
      v-else
      class="flex flex-col gap-2.5"
    >
      <BaseSelect
        v-model="chosen"
        label="Passar para"
        :options="options"
      />
      <div class="flex gap-2.5">
        <button
          type="button"
          class="border border-brand bg-brand px-4 py-2.5 text-sm font-semibold text-white"
          @click="confirm"
        >
          Confirmar
        </button>
        <button
          type="button"
          class="border border-line-button px-4 py-2.5 text-sm font-medium text-brand"
          @click="editing = false"
        >
          Cancelar
        </button>
      </div>
    </div>

    <p class="text-sm leading-normal text-ink-soft">
      A reatribuição fica registrada e quem assume recebe notificação com o prazo restante.
    </p>
  </section>
</template>
