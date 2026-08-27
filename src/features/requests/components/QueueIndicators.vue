<script setup lang="ts">
import { DEADLINE_ALERT_DAYS } from '@/features/requests/constants/requestPolicy'

/** Os três números que abrem a fila: quanto há, quanto já passou e quanto vai passar. */
const { open, overdue, dueSoon } = defineProps<{
  open: number
  overdue: number
  dueSoon: number
}>()

const indicators = [
  { value: () => open, label: 'Em atendimento', tone: 'border-l-brand text-brand' },
  { value: () => overdue, label: 'Fora do prazo legal', tone: 'border-l-danger text-danger' },
  {
    value: () => dueSoon,
    label: `Vencem em até ${DEADLINE_ALERT_DAYS} dias`,
    tone: 'border-l-due-soon text-due-soon-ink',
  },
]
</script>

<template>
  <dl class="flex flex-wrap gap-6">
    <div
      v-for="indicator in indicators"
      :key="indicator.label"
      class="flex min-w-[132px] flex-col gap-0.5 border-l-[3px] py-1 pl-3.5"
      :class="indicator.tone"
    >
      <dd class="font-label text-[28px] font-bold leading-none">
        {{ indicator.value() }}
      </dd>
      <dt class="text-[13px] leading-snug text-ink-soft">
        {{ indicator.label }}
      </dt>
    </div>
  </dl>
</template>
