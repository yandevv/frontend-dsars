<script setup lang="ts">
import { useId } from 'vue'

import { ACCESS_FORMATS } from '@/features/requests/utils/responseDeadline'
import type { AccessFormat } from '@/features/requests/types/request'

/**
 * O formato do acesso aos dados, que decide o prazo: o simplificado sai na
 * hora, a declaração completa tem até 15 dias. Só aparece quando o direito
 * escolhido é o acesso.
 */
const { invalid = false, disabled = false, legend = 'Como você quer receber os dados?' } =
  defineProps<{
    invalid?: boolean
    disabled?: boolean
    legend?: string
  }>()

const model = defineModel<AccessFormat | ''>({ required: true })

const groupName = useId()
</script>

<template>
  <fieldset
    class="flex flex-col gap-3"
    :disabled="disabled"
  >
    <legend class="mb-1 flex flex-col gap-1">
      <span class="text-base font-semibold text-ink">
        {{ legend }}
        <span
          class="text-danger"
          aria-hidden="true"
        >*</span>
      </span>
      <span class="text-sm leading-normal text-ink-muted">
        O formato decide o prazo de resposta.
      </span>
    </legend>
    <div class="grid gap-2.5 sm:grid-cols-2">
      <label
        v-for="format in ACCESS_FORMATS"
        :key="format.value"
        class="flex cursor-pointer items-start gap-3 px-4 py-3.5"
        :class="
          model === format.value
            ? 'border-2 border-brand bg-brand-wash'
            : invalid
              ? 'border border-danger-line bg-surface'
              : 'border border-line bg-surface'
        "
      >
        <input
          v-model="model"
          type="radio"
          :name="groupName"
          :value="format.value"
          class="mt-0.5 size-5 shrink-0 accent-brand"
        >
        <span class="flex flex-col gap-0.5">
          <span class="text-[15px] font-semibold text-ink">{{ format.label }}</span>
          <span class="text-sm leading-normal text-ink-soft">{{ format.summary }}</span>
        </span>
      </label>
    </div>
    <p
      v-if="invalid"
      class="text-[13px] text-danger"
    >
      Escolha o formato para registrar o pedido de acesso.
    </p>
  </fieldset>
</template>
