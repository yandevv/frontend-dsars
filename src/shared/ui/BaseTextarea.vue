<script setup lang="ts">
import { computed, useId, useTemplateRef } from 'vue'

/**
 * Campo de texto longo, com rótulo, auxílio, erro e contador.
 *
 * Irmão de `BaseField`, mas não uma variante dele: o rótulo aqui é maior, a
 * explicação vem entre o rótulo e o campo — e não depois —, e o contador de
 * caracteres divide a linha com a mensagem de auxílio. Tentar cobrir as duas
 * formas num componente só custaria mais propriedades do que os dois arquivos.
 */
const {
  label,
  hint,
  description,
  error,
  rows = 6,
  maxlength,
  placeholder,
  disabled = false,
  required = false,
} = defineProps<{
  label: string
  /** Explicação longa, entre o rótulo e o campo. */
  description?: string
  /** Linha curta sob o campo, ao lado do contador. */
  hint?: string
  /** Substitui o auxílio e marca o campo como inválido. */
  error?: string
  rows?: number
  maxlength?: number
  placeholder?: string
  disabled?: boolean
  required?: boolean
}>()

const model = defineModel<string>({ required: true })

const fieldId = useId()
const hintId = `${fieldId}-auxilio`
const descriptionId = `${fieldId}-descricao`

const describedBy = computed(() =>
  [description ? descriptionId : null, error || hint ? hintId : null].filter(Boolean).join(' ') ||
  undefined,
)

const textarea = useTemplateRef<HTMLTextAreaElement>('textarea')
defineExpose({ focus: () => textarea.value?.focus() })
</script>

<template>
  <div class="flex flex-col gap-2">
    <label
      :for="fieldId"
      class="text-base font-semibold text-ink"
    >
      {{ label }}
      <span
        v-if="required"
        class="text-danger"
        aria-hidden="true"
      >*</span>
    </label>

    <p
      v-if="description"
      :id="descriptionId"
      class="max-w-[76ch] text-sm leading-normal text-ink-muted"
    >
      {{ description }}
    </p>

    <textarea
      :id="fieldId"
      ref="textarea"
      v-model="model"
      :rows="rows"
      :maxlength="maxlength"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="describedBy"
      class="resize-y px-[15px] py-3.5 text-base leading-relaxed text-ink"
      :class="[
        error ? 'border-2 border-danger' : 'border border-field-line',
        disabled ? 'border-field-disabled-line bg-field-disabled text-ink-soft' : 'bg-surface',
      ]"
    />

    <div class="flex items-baseline justify-between gap-4">
      <p
        :id="hintId"
        class="text-[13px] leading-normal"
        :class="error ? 'text-danger' : 'text-ink-muted'"
      >
        {{ error ?? hint }}
      </p>
      <p
        v-if="maxlength"
        class="shrink-0 font-label text-[13px]"
        :class="error ? 'text-danger' : 'text-ink-muted'"
      >
        {{ model.length }} / {{ maxlength }}
      </p>
    </div>
  </div>
</template>
