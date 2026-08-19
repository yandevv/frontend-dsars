<script setup lang="ts">
import { RESPONSE_DEADLINES } from '@/features/landing/data/responseDeadlines'
</script>

<template>
  <!--
    Par rótulo/explicação: `dl` descreve isso melhor do que divs. Empilha em
    telas estreitas e vira duas colunas com filete central a partir de md.
  -->
  <dl
    class="grid divide-y divide-line border-b border-line md:grid-cols-2 md:divide-x md:divide-y-0"
  >
    <div
      v-for="deadline in RESPONSE_DEADLINES"
      :key="deadline.label"
      class="flex flex-col gap-1.5 px-5 py-[18px] md:px-14 md:py-[30px]"
    >
      <dt class="font-serif text-xl font-semibold text-brand md:text-[26px]">
        {{ deadline.label }}
      </dt>
      <dd class="text-sm leading-[1.6] text-ink-body md:text-[15px]">
        {{ deadline.description }}
      </dd>
    </div>
  </dl>
</template>
