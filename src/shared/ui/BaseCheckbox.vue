<script setup lang="ts">
import { computed, useId } from 'vue'

/**
 * Caixa de seleção com rótulo rico (o aceite dos termos carrega links).
 *
 * `boxed` reproduz a variante emoldurada do design, usada quando a opção tem
 * uma explicação abaixo do rótulo e precisa se destacar do resto do formulário.
 */
const {
  boxed = false,
  error,
  disabled = false,
} = defineProps<{
  boxed?: boolean
  /** Mensagem de erro exibida abaixo do rótulo; também marca a moldura. */
  error?: string
  disabled?: boolean
}>()

const model = defineModel<boolean>({ required: true })

const inputId = useId()
const errorId = `${inputId}-erro`

const wrapperClasses = computed(() => [
  'flex items-start gap-3',
  boxed || error ? 'px-4 py-3.5' : 'py-1',
  error
    ? 'border-2 border-danger bg-danger-wash'
    : boxed
      ? 'border border-line bg-surface-muted'
      : '',
  disabled ? 'opacity-55' : 'cursor-pointer',
])
</script>

<template>
  <div>
    <label :class="wrapperClasses">
      <input
        :id="inputId"
        v-model="model"
        type="checkbox"
        :disabled="disabled"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="error ? errorId : undefined"
        class="mt-0.5 size-5 shrink-0 accent-brand"
      >
      <span class="flex flex-col gap-1">
        <slot />
        <span
          v-if="error"
          :id="errorId"
          class="text-[13px] leading-normal text-danger"
        >{{ error }}</span>
      </span>
    </label>
  </div>
</template>
