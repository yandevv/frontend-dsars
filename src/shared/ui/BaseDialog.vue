<script setup lang="ts">
import { nextTick, onBeforeUnmount, useId, useTemplateRef, watch } from "vue";

/**
 * Janela de confirmação sobre a página, no formato do modal de cancelamento.
 *
 * Toda ação que exclui, cancela ou altera algo pede confirmação antes, e todas
 * passam por aqui: é o que garante o mesmo comportamento de teclado em todas —
 * o foco entra na janela, circula só dentro dela, Esc fecha, e ao fechar volta
 * para o botão que a abriu.
 *
 * Em telas estreitas vira uma folha presa ao pé da tela, como no design para
 * celular: o polegar alcança os botões sem esticar.
 */
const {
  title,
  eyebrow,
  tone = "neutral",
  locked = false,
  width = "md",
} = defineProps<{
  title: string;
  /** Linha em caixa-alta acima do título — "Cancelamento individual". */
  eyebrow?: string;
  /** `danger` pinta o sobretítulo como alerta: a ação não tem volta. */
  tone?: "neutral" | "danger";
  /** Durante um envio a janela não fecha: fechar não desfaz o que já saiu. */
  locked?: boolean;
  width?: "sm" | "md";
}>();

const open = defineModel<boolean>("open", { required: true });

defineSlots<{
  default(): unknown;
  /** Botões, à direita no rodapé. */
  actions?(): unknown;
  /** Texto de apoio à esquerda dos botões — onde a ação fica registrada. */
  note?(): unknown;
}>();

const titleId = useId();
const panel = useTemplateRef<HTMLElement>("panel");

let returnFocusTo: HTMLElement | null = null;

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function focusables(): HTMLElement[] {
  return panel.value ? Array.from(panel.value.querySelectorAll<HTMLElement>(FOCUSABLE)) : [];
}

function close() {
  if (!locked) open.value = false;
}

/** Tab e Shift+Tab dão a volta dentro da janela em vez de fugir para a página atrás. */
function onKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    event.stopPropagation();
    close();
    return;
  }
  if (event.key !== "Tab") return;

  const items = focusables();
  const first = items[0];
  const last = items[items.length - 1];
  if (!first || !last) {
    event.preventDefault();
    return;
  }

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function lockScroll(lock: boolean) {
  document.body.style.overflow = lock ? "hidden" : "";
}

watch(
  open,
  async (isOpen) => {
    if (isOpen) {
      returnFocusTo = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      lockScroll(true);
      await nextTick();
      // O primeiro campo, se houver; senão a própria janela, para o leitor de
      // tela anunciar o título antes dos botões.
      const field = panel.value?.querySelector<HTMLElement>("input, textarea, select");
      (field ?? panel.value)?.focus();
    } else {
      lockScroll(false);
      returnFocusTo?.focus();
      returnFocusTo = null;
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  if (open.value) lockScroll(false);
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-end justify-center bg-ink/55 md:items-center md:p-12"
      @click.self="close"
    >
      <div
        ref="panel"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        tabindex="-1"
        class="flex max-h-[92dvh] w-full flex-col overflow-y-auto border-t-2 border-ink bg-surface shadow-[0_10px_28px_rgba(16,20,19,0.28)] outline-none md:max-h-full md:border md:border-line-strong"
        :class="width === 'sm' ? 'md:max-w-[560px]' : 'md:max-w-[640px]'"
        @keydown="onKeydown"
      >
        <div
          class="flex items-start justify-between gap-5 border-b border-line px-5 pb-5 pt-[22px] md:px-[30px] md:pt-[26px]"
        >
          <div class="flex flex-col gap-2">
            <p
              v-if="eyebrow"
              class="font-label text-[11px] font-semibold uppercase tracking-[0.07em]"
              :class="tone === 'danger' ? 'text-danger-strong' : 'text-ink-soft'"
            >
              {{ eyebrow }}
            </p>
            <h2
              :id="titleId"
              class="font-serif text-[22px] font-semibold leading-tight text-ink md:text-[26px]"
            >
              {{ title }}
            </h2>
          </div>
          <button
            type="button"
            class="flex size-10 shrink-0 items-center justify-center border border-line text-xl text-ink-soft hover:border-brand disabled:cursor-not-allowed disabled:opacity-60"
            :disabled="locked"
            @click="close"
          >
            <span aria-hidden="true">×</span>
            <span class="sr-only">Fechar</span>
          </button>
        </div>

        <div class="flex flex-col gap-5 px-5 pb-[26px] pt-6 md:px-[30px]">
          <slot />
        </div>

        <div
          v-if="$slots.actions || $slots.note"
          class="flex flex-col gap-4 border-t border-line bg-surface-subtle px-5 pb-6 pt-5 md:flex-row md:flex-wrap md:items-center md:justify-between md:px-[30px]"
        >
          <p v-if="$slots.note" class="max-w-[44ch] text-[13px] leading-normal text-ink-muted">
            <slot name="note" />
          </p>
          <!-- No celular os botões empilham com a ação principal por cima. -->
          <div
            class="flex flex-col-reverse gap-2.5 md:ml-auto md:flex-row md:flex-wrap md:items-center"
          >
            <slot name="actions" />
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
