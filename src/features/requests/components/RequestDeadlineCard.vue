<script setup lang="ts">
import { computed } from 'vue'

import { LEGAL_DEADLINE_DAYS } from '@/features/requests/constants/requestPolicy'
import { daysLeft, deadlineLabel, deadlineStatusOf } from '@/features/requests/utils/deadline'
import { formatDate } from '@/shared/utils/date'
import type { DataRequest } from '@/features/requests/types/request'

/**
 * O prazo legal em destaque (RF014).
 *
 * O número grande é relativo — "Venceu há 2 dias" —, mas a data absoluta vem
 * logo abaixo: é ela que vale no relatório à autoridade.
 */
const { request } = defineProps<{ request: DataRequest }>()

const situation = computed(() => deadlineStatusOf(request))

const cardClasses = computed(
  () =>
    ({
      vencida: 'border-danger-line bg-danger-wash',
      proxima: 'border-pending-line bg-due-soon-wash',
      'em-dia': 'border-brand-line bg-brand-wash',
      encerrada: 'border-line bg-field-disabled',
    })[situation.value],
)

const valueClasses = computed(
  () =>
    ({
      vencida: 'text-danger',
      proxima: 'text-due-soon-ink',
      'em-dia': 'text-brand',
      encerrada: 'text-ink-soft',
    })[situation.value],
)

const headline = computed(() => {
  if (request.status === 'concluida' && request.closedAt) {
    return `Respondida em ${formatDate(request.closedAt)}`
  }
  return deadlineLabel(request)
})

const detail = computed(() => {
  if (request.status === 'concluida' && request.closedAt) {
    const slack = daysLeft(request, new Date(request.closedAt))
    if (slack < 0) return `Encerrada com ${Math.abs(slack)} dias de atraso sobre o prazo legal.`
    return `Encerrada ${slack} dias antes do prazo legal.`
  }
  if (request.status === 'cancelada' && request.closedAt) {
    return `Cancelada pelo titular em ${formatDate(request.closedAt)}.`
  }
  return `Prazo legal em ${formatDate(request.dueAt)} · registro em ${formatDate(request.registeredAt)}`
})
</script>

<template>
  <section
    class="flex flex-col gap-2 border px-[22px] py-5"
    :class="cardClasses"
  >
    <h2 class="font-label text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-soft">
      Prazo legal
    </h2>
    <p
      class="font-label text-[26px] font-bold leading-tight"
      :class="valueClasses"
    >
      {{ headline }}
    </p>
    <p class="text-[15px] text-ink-body">
      {{ detail }}
    </p>
    <p class="text-sm leading-normal text-ink-soft">
      {{ LEGAL_DEADLINE_DAYS }} dias contados do registro, como determina a LGPD. Atrasos entram
      no relatório trimestral à diretoria.
    </p>
  </section>
</template>
