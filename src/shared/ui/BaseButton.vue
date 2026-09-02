<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, type RouteLocationRaw } from "vue-router";

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
  variant = "primary",
  size = "md",
  block = false,
  type = "button",
  disabled = false,
  busy = false,
} = defineProps<{
  to?: RouteLocationRaw;
  href?: string;
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md";
  /** Ocupa toda a largura disponível — usado nas CTAs em telas estreitas. */
  block?: boolean;
  type?: "button" | "submit" | "reset";
  /** Ação indisponível — por exemplo o acesso bloqueado do RN008. */
  disabled?: boolean;
  /** Envio em andamento: trava o botão e mostra que algo está acontecendo. */
  busy?: boolean;
}>();

const isBlocked = computed(() => disabled || busy);

const tag = computed(() => {
  if (to !== undefined) return RouterLink;
  if (href !== undefined) return "a";
  return "button";
});

/**
 * Só os atributos do elemento escolhido.
 *
 * Passar `:href="undefined"` junto com `:to` apagaria o `href` que o próprio
 * RouterLink gera, deixando uma <a> sem destino — inalcançável pelo teclado.
 */
const elementAttrs = computed(() => {
  if (to !== undefined) return { to };
  if (href !== undefined) return { href };
  return { type, disabled: isBlocked.value || undefined };
});

/**
 * `busy` e `disabled` ganham cor própria em vez de só ficarem opacos: o design
 * distingue "estou trabalhando nisso" de "isto não está disponível".
 */
const variantClasses = computed(() => {
  if (variant === "secondary") {
    return isBlocked.value
      ? "border-field-disabled-line font-medium text-ink-soft"
      : "border-line-button font-medium text-brand hover:border-brand hover:text-brand-strong";
  }
  if (variant === "danger") {
    if (busy) return "border-danger-busy bg-danger-busy font-semibold text-white";
    if (disabled) return "border-field-line bg-field-line font-semibold text-white";
    return "border-danger bg-danger font-semibold text-white hover:border-danger-strong hover:bg-danger-strong";
  }
  if (busy) return "border-brand-busy bg-brand-busy font-semibold text-white";
  if (disabled) return "border-field-line bg-field-line font-semibold text-white";
  return "border-brand bg-brand font-semibold text-white hover:border-brand-strong hover:bg-brand-strong";
});

const classes = computed(() => [
  "inline-flex items-center justify-center gap-2.5 border text-center no-underline transition-colors",
  size === "sm" ? "px-5 py-3 text-[15px]" : "px-[30px] py-[15px] text-base",
  variantClasses.value,
  block ? "w-full" : "",
  isBlocked.value ? "cursor-not-allowed" : "",
]);
</script>

<template>
  <component :is="tag" v-bind="elementAttrs" :class="classes" :aria-busy="busy || undefined">
    <span
      v-if="busy"
      aria-hidden="true"
      class="inline-block size-3.5 animate-spin rounded-full border-2 border-white border-r-transparent"
    />
    <slot />
  </component>
</template>
