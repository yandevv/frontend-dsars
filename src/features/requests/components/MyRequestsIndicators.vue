<script setup lang="ts">
import { computed } from "vue";

import { DEADLINE_ALERT_DAYS } from "@/features/requests/constants/requestPolicy";
import type { MyRequestsCounts } from "@/features/requests/composables/useMyRequests";

/** A faixa de números acima da lista do titular, na ordem em que importam. */
const { counts } = defineProps<{ counts: MyRequestsCounts }>();

const items = computed(() => [
  { value: counts.open, label: "em andamento", tone: "text-ink" },
  {
    value: counts.dueSoon,
    label: `vencem em até ${DEADLINE_ALERT_DAYS} dias`,
    tone: "text-warning",
  },
  { value: counts.overdue, label: "com prazo vencido", tone: "text-danger" },
  { value: counts.closed, label: "encerradas", tone: "text-ink" },
]);
</script>

<template>
  <dl class="grid grid-cols-2 border border-line bg-surface-muted sm:grid-cols-4">
    <div
      v-for="(item, index) in items"
      :key="item.label"
      class="flex flex-col-reverse gap-1 border-line px-5 py-4"
      :class="[
        index < items.length - 1 ? 'sm:border-r' : '',
        index % 2 === 0 ? 'max-sm:border-r' : '',
        index < 2 ? 'max-sm:border-b' : '',
      ]"
    >
      <dt class="text-sm text-ink-soft">
        {{ item.label }}
      </dt>
      <dd class="font-label text-[26px] font-bold leading-none" :class="item.tone">
        {{ item.value }}
      </dd>
    </div>
  </dl>
</template>
