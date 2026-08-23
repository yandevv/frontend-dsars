<script setup lang="ts">
import { computed, useId, useTemplateRef } from 'vue'

/**
 * Campo de texto com rótulo, auxílio e erro — o formato usado em todos os
 * formulários do design.
 *
 * O rótulo é um `<label for>` de verdade e as mensagens são ligadas ao campo
 * por `aria-describedby`, de modo que quem usa leitor de tela ouça o auxílio
 * junto com o rótulo em vez de encontrá-lo solto depois do campo.
 */
const {
  label,
  type = 'text',
  hint,
  hintTone = 'muted',
  error,
  disabled = false,
  locked = false,
  placeholder,
  autocomplete,
  required = false,
} = defineProps<{
  label: string
  type?: 'text' | 'email' | 'password'
  hint?: string
  /** Cor do auxílio: o design confirma acertos em verde, não só erros em vermelho. */
  hintTone?: 'muted' | 'positive'
  /** Quando presente, substitui o auxílio e marca o campo como inválido. */
  error?: string
  /** Fora de alcance por ora — o envio em curso, o bloqueio do RN008. */
  disabled?: boolean
  /**
   * Nunca editável: o e-mail que vem no convite, por exemplo.
   *
   * Trava o campo sem esmaecer rótulo e auxílio, como o design faz no quadro
   * 1c — quem não pode mudar o valor precisa justamente ler o porquê.
   */
  locked?: boolean
  placeholder?: string
  autocomplete?: string
  required?: boolean
}>()

const model = defineModel<string>({ required: true })

const inputId = useId()
const hintId = `${inputId}-auxilio`
const errorId = `${inputId}-erro`

const describedBy = computed(() => {
  const ids = []
  if (error) ids.push(errorId)
  else if (hint) ids.push(hintId)
  return ids.length > 0 ? ids.join(' ') : undefined
})

const isFrozen = computed(() => disabled || locked)

const inputClasses = computed(() => [
  'w-full bg-surface px-3.5 py-[13px] text-base text-ink',
  error ? 'border-2 border-danger' : 'border border-field-line',
  isFrozen.value ? 'border-field-disabled-line bg-field-disabled text-ink-soft' : '',
])

function onInput(event: Event) {
  model.value = (event.target as HTMLInputElement).value
}

const input = useTemplateRef<HTMLInputElement>('input')

/**
 * Permite que a tela devolva o foco ao campo depois de um aviso — por exemplo
 * quando o acesso pede para corrigir o endereço digitado.
 */
defineExpose({ focus: () => input.value?.focus() })
</script>

<template>
  <div
    class="flex flex-col gap-1.5"
    :class="disabled ? 'opacity-55' : ''"
  >
    <div class="flex items-baseline justify-between gap-3">
      <label
        :for="inputId"
        class="text-sm font-semibold text-ink"
      >{{ label }}</label>
      <slot name="action" />
    </div>

    <!--
      `:type` é dinâmico (a senha alterna entre oculta e visível), e o v-model
      do Vue não aceita isso em <input>; por isso valor e evento são explícitos.
    -->
    <input
      :id="inputId"
      ref="input"
      :type="type"
      :value="model"
      :disabled="isFrozen"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :required="required"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="describedBy"
      :class="inputClasses"
      @input="onInput"
    >

    <p
      v-if="error"
      :id="errorId"
      class="text-[13px] leading-normal text-danger"
    >
      {{ error }}
    </p>
    <p
      v-else-if="hint"
      :id="hintId"
      class="text-[13px] leading-normal"
      :class="hintTone === 'positive' ? 'text-brand' : 'text-ink-muted'"
    >
      {{ hint }}
    </p>
  </div>
</template>
