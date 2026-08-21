<script setup lang="ts">
import { computed } from 'vue'

/**
 * Bloco de aviso das telas de conta.
 *
 * O design usa dois pesos: a faixa com filete à esquerda para o retorno de um
 * envio, e a moldura inteira para o que interrompe o fluxo (o bloqueio do
 * RN008). O título muda de tipografia junto com o peso — sem serifa quando é
 * um recado curto sobre os campos, com serifa quando é um acontecimento.
 */
const {
  variant = 'error',
  size = 'sm',
  framed = false,
  title,
} = defineProps<{
  variant?: 'error' | 'warning' | 'success'
  /** `sm`: recado sobre o formulário. `md`: acontecimento, com título serifado. */
  size?: 'sm' | 'md'
  /** Moldura completa em vez de filete à esquerda, para o que trava o acesso. */
  framed?: boolean
  title: string
}>()

/**
 * Erros e pendências interrompem a leitura; a confirmação de sucesso só
 * precisa ser anunciada quando o leitor de tela chegar nela.
 */
const role = computed(() => (variant === 'success' ? 'status' : 'alert'))

const containerClasses = computed(() => [
  'flex flex-col gap-2.5',
  framed ? 'border-2 p-[18px]' : 'border-l-[3px] px-4 py-3.5',
  {
    error: 'border-danger bg-danger-wash text-danger-body',
    warning: 'border-warning bg-warning-wash text-ink-body',
    success: 'border-brand bg-brand-wash text-ink-body',
  }[variant],
])

const titleClasses = computed(() => [
  size === 'md'
    ? 'font-serif text-xl font-semibold leading-tight'
    : 'text-[15px] font-semibold',
  variant === 'error' ? 'text-danger-strong' : 'text-ink',
])
</script>

<template>
  <div
    :role="role"
    :class="containerClasses"
  >
    <p :class="titleClasses">
      {{ title }}
    </p>
    <div class="flex flex-col gap-2.5 text-sm leading-relaxed">
      <slot />
    </div>
  </div>
</template>
