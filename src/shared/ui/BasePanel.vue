<script setup lang="ts">
/**
 * Bloco com cabeçalho e moldura — a forma que se repete em toda a área do
 * encarregado: pedido do titular, histórico, notas internas, dados do titular.
 *
 * O cabeçalho é um `<h2>` de verdade, e não um texto em caixa-alta: são as
 * seções da página, e é por elas que se navega com leitor de tela.
 */
const { eyebrow, title, tone = 'muted' } = defineProps<{
  eyebrow: string
  /** Título serifado abaixo do sobretítulo, onde o design o usa. */
  title?: string
  /** `brand` destaca o bloco que pede ação, como o painel de finalização. */
  tone?: 'muted' | 'brand'
}>()
</script>

<template>
  <section
    class="bg-surface"
    :class="tone === 'brand' ? 'border border-brand' : 'border border-line'"
  >
    <div
      class="flex flex-wrap items-start justify-between gap-4 border-b border-line px-[22px] py-4"
      :class="tone === 'brand' ? 'bg-brand-wash' : 'bg-surface-muted'"
    >
      <div class="flex flex-col gap-1.5">
        <h2
          class="font-label text-[11px] font-semibold uppercase tracking-[0.07em]"
          :class="tone === 'brand' ? 'text-brand' : 'text-ink-soft'"
        >
          {{ eyebrow }}
        </h2>
        <p
          v-if="title"
          class="font-serif text-2xl font-semibold leading-tight text-ink"
        >
          {{ title }}
        </p>
      </div>
      <slot name="action" />
    </div>
    <slot />
  </section>
</template>
