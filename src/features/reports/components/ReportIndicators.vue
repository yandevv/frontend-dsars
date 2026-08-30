<script setup lang="ts">
import type { ReportIndicator } from '@/features/reports/types/report'

/** Os quatro números que abrem o relatório. */
defineProps<{ indicators: readonly ReportIndicator[] }>()
</script>

<template>
  <dl class="grid gap-px border border-line bg-line sm:grid-cols-2 xl:grid-cols-4">
    <div
      v-for="indicator in indicators"
      :key="indicator.label"
      class="flex flex-col gap-1.5 bg-surface px-[22px] py-5"
    >
      <dt class="font-label text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-soft">
        {{ indicator.label }}
      </dt>
      <dd class="flex items-baseline gap-1.5">
        <span
          class="font-label text-[40px] font-bold leading-none"
          :class="indicator.tone"
        >{{ indicator.value }}</span>
        <span
          v-if="indicator.unit"
          class="text-[15px] text-ink-soft"
        >{{ indicator.unit }}</span>
      </dd>
      <dd class="text-sm leading-normal text-ink-muted">
        {{ indicator.note }}
      </dd>
    </div>
  </dl>
</template>
