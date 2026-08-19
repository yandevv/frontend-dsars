<script setup lang="ts">
import { REQUEST_FLOW_STEPS } from '@/features/landing/data/requestFlowSteps'
</script>

<template>
  <section
    aria-labelledby="titulo-fluxo"
    class="flex flex-col gap-4 border-b border-line bg-surface-muted px-5 py-[26px] md:gap-6 md:px-14 md:py-12"
  >
    <h2
      id="titulo-fluxo"
      class="font-serif text-[23px] font-semibold text-ink md:text-[30px]"
    >
      Como o atendimento funciona
    </h2>

    <ol
      role="list"
      class="grid list-none gap-4 md:grid-cols-3 md:gap-7"
    >
      <li
        v-for="step in REQUEST_FLOW_STEPS"
        :key="step.number"
        class="flex flex-col gap-1.5 border-t-2 border-brand pt-3 md:gap-2 md:pt-3.5"
      >
        <span class="font-label text-xs text-brand">{{ step.number }}</span>
        <span class="text-base font-semibold text-ink md:text-[17px]">{{ step.title }}</span>
        <span class="text-sm leading-[1.55] text-ink-soft md:leading-[1.6]">
          {{ step.description }}
        </span>
      </li>
    </ol>
  </section>
</template>
