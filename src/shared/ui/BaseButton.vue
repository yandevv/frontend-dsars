<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'

/**
 * Ação em formato de botão, seguindo os dois estilos do design.
 *
 * Escolhe sozinho o elemento certo: `RouterLink` quando recebe `to`,
 * `<a>` quando recebe `href` (links externos, `mailto:`, `tel:`) e
 * `<button>` caso contrário.
 */
const {
  to,
  href,
  variant = 'primary',
  size = 'md',
  block = false,
  type = 'button',
} = defineProps<{
  to?: RouteLocationRaw
  href?: string
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md'
  /** Ocupa toda a largura disponível — usado nas CTAs em telas estreitas. */
  block?: boolean
  type?: 'button' | 'submit' | 'reset'
}>()

const tag = computed(() => {
  if (to !== undefined) return RouterLink
  if (href !== undefined) return 'a'
  return 'button'
})

/**
 * Só os atributos do elemento escolhido.
 *
 * Passar `:href="undefined"` junto com `:to` apagaria o `href` que o próprio
 * RouterLink gera, deixando uma <a> sem destino — inalcançável pelo teclado.
 */
const elementAttrs = computed(() => {
  if (to !== undefined) return { to }
  if (href !== undefined) return { href }
  return { type }
})

const classes = computed(() => [
  'inline-flex items-center justify-center border text-center no-underline transition-colors',
  size === 'sm' ? 'px-5 py-3 text-[15px]' : 'px-[30px] py-[15px] text-base',
  variant === 'primary'
    ? 'border-brand bg-brand font-semibold text-white hover:border-brand-strong hover:bg-brand-strong'
    : 'border-line-button font-medium text-brand hover:border-brand hover:text-brand-strong',
  block ? 'w-full' : '',
])
</script>

<template>
  <component
    :is="tag"
    v-bind="elementAttrs"
    :class="classes"
  >
    <slot />
  </component>
</template>
