<script setup lang="ts">
import type { HelpQuestion } from '@/features/help/types/help'

/**
 * Perguntas frequentes, abertas uma a uma. `<details>` já dá o teclado e o
 * anúncio de aberto/fechado a quem usa leitor de tela, sem código.
 */
defineProps<{ questions: readonly HelpQuestion[] }>()
</script>

<template>
  <div class="flex flex-col border border-line">
    <details
      v-for="item in questions"
      :key="item.question"
      class="group border-b border-line-soft last:border-b-0"
    >
      <summary
        class="flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-4 text-base font-semibold text-ink hover:bg-surface-subtle [&::-webkit-details-marker]:hidden"
      >
        <span>{{ item.question }}</span>
        <span
          aria-hidden="true"
          class="font-label text-xl leading-none text-brand group-open:rotate-45"
        >+</span>
      </summary>
      <p class="max-w-[72ch] px-5 pb-5 text-[15px] leading-relaxed text-ink-body">
        {{ item.answer }}
      </p>
    </details>
  </div>
</template>
