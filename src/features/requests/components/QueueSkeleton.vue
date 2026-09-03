<script setup lang="ts">
/**
 * O que ocupa a fila enquanto os dados não chegam.
 *
 * Mantém a altura das linhas para que a tabela não salte quando o conteúdo
 * entrar, e o texto embaixo diz o que está acontecendo — a forma cinza sozinha
 * não é anunciada a quem usa leitor de tela.
 */
const { label = "Buscando na fila da organização…" } = defineProps<{ label?: string }>();

const widths = ["58%", "44%", "66%", "38%", "52%", "48%"];
</script>

<template>
  <div role="status" class="border border-line">
    <div
      v-for="width in widths"
      :key="width"
      aria-hidden="true"
      class="flex items-center gap-6 border-b border-line-soft px-4 py-[18px]"
    >
      <span class="size-[18px] shrink-0 bg-skeleton" />
      <span class="h-3.5 w-[88px] shrink-0 bg-skeleton" />
      <span class="flex flex-1 flex-col gap-2">
        <span class="block h-3.5 bg-skeleton" :style="{ width }" />
        <span class="block h-[11px] w-[124px] bg-track-bar" />
      </span>
      <span class="h-[26px] w-[118px] shrink-0 bg-track-bar" />
      <span class="h-3.5 w-[92px] shrink-0 bg-skeleton" />
      <span class="h-3.5 w-[104px] shrink-0 bg-skeleton" />
    </div>
    <p class="bg-surface-subtle px-4 py-3.5 text-sm text-ink-muted">
      {{ label }}
    </p>
  </div>
</template>
