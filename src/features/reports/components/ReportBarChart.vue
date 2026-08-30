<script setup lang="ts">
import type { ReportBar } from '@/features/reports/types/report'

/**
 * Composição do período, em barras.
 *
 * Cada barra traz o número absoluto ao lado da participação: a largura ajuda a
 * comparar de relance, mas quem vai levar o dado a uma reunião precisa do
 * valor. O gráfico em si fica escondido de leitores de tela — a lista de
 * números acima dele já diz tudo o que ele desenha.
 */
defineProps<{
  title: string
  note: string
  bars: readonly ReportBar[]
}>()
</script>

<template>
  <section class="flex flex-col border border-line">
    <div
      class="flex flex-wrap items-baseline justify-between gap-4 border-b border-line px-[22px] py-4"
    >
      <h2 class="font-serif text-xl font-semibold text-ink">
        {{ title }}
      </h2>
      <p class="text-[13px] text-ink-muted">
        {{ note }}
      </p>
    </div>

    <div class="flex flex-col gap-4 px-[22px] pb-6 pt-5">
      <div
        v-for="bar in bars"
        :key="bar.label"
        class="flex flex-col gap-2"
      >
        <div class="flex items-baseline justify-between gap-4">
          <p class="text-[15px] font-medium text-ink">
            {{ bar.label }}
          </p>
          <p class="flex items-baseline gap-2">
            <span class="font-label text-[17px] font-bold text-ink">{{ bar.total }}</span>
            <span class="text-[13px] text-ink-muted">{{ bar.share }}</span>
          </p>
        </div>
        <div
          aria-hidden="true"
          class="h-3.5 bg-track-bar"
        >
          <div
            class="h-3.5"
            :class="bar.color"
            :style="{ width: bar.width }"
          />
        </div>
      </div>
      <slot />
    </div>
  </section>
</template>
