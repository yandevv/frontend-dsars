<script setup lang="ts">
import { computed } from 'vue'

import { LEGAL_DEADLINE_DAYS } from '@/features/requests/constants/requestPolicy'
import { dueFromReceived, isFutureDay } from '@/features/requests/utils/onBehalf'
import { daysUntil, formatDate } from '@/shared/utils/date'

/**
 * Coluna de apoio do registro por terceiro.
 *
 * O prazo muda enquanto a data de recebimento muda: é aqui que a encarregada
 * vê, antes de registrar, que uma carta antiga já chega à fila vencida.
 */
const { receivedOn, author } = defineProps<{
  /** Dia do recebimento, no formato do campo de data. */
  receivedOn: string
  author: string
}>()

const valid = computed(() => receivedOn !== '' && !isFutureDay(receivedOn))

/** Dias desde que o pedido chegou — 0 quando chegou hoje. */
const elapsed = computed(() =>
  valid.value ? -daysUntil(new Date(`${receivedOn}T12:00:00`).toISOString()) : 0,
)

const overdue = computed(() => valid.value && elapsed.value > LEGAL_DEADLINE_DAYS)

const title = computed(() =>
  valid.value
    ? `${LEGAL_DEADLINE_DAYS} dias · até ${formatDate(dueFromReceived(receivedOn))}`
    : `${LEGAL_DEADLINE_DAYS} dias a contar do recebimento`,
)

const text = computed(() => {
  if (!valid.value) return 'Informe uma data de recebimento de hoje ou anterior para calcular o prazo.'
  if (overdue.value) {
    return `O pedido chegou há ${elapsed.value} dias: este registro já nasce fora do prazo legal e entra na fila marcado como vencido.`
  }
  if (elapsed.value > 0) {
    const left = LEGAL_DEADLINE_DAYS - elapsed.value
    return `O pedido chegou há ${elapsed.value} ${elapsed.value === 1 ? 'dia' : 'dias'}. ${left === 0 ? 'O prazo vence hoje' : `Restam ${left} ${left === 1 ? 'dia' : 'dias'} do prazo legal`}, contado do recebimento e não do registro.`
  }
  return 'O pedido chegou hoje: o prazo legal conta a partir de agora.'
})

const steps = [
  'O sistema gera protocolo e identificador únicos e conta o prazo desde a data de recebimento.',
  'Se o titular tiver conta, a requisição aparece na lista dele com aviso de que foi registrada pela encarregada.',
  'A requisição entra na fila de atendimento com você como responsável.',
]
</script>

<template>
  <aside
    class="hidden flex-col gap-[22px] border border-line bg-surface-muted px-[26px] pb-[30px] pt-[26px] lg:flex"
  >
    <section
      class="flex flex-col gap-2.5"
      :class="overdue ? 'border-l-[3px] border-danger pl-4' : ''"
      aria-live="polite"
    >
      <h2 class="font-label text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-soft">
        Prazo desta requisição
      </h2>
      <p
        class="font-serif text-2xl font-semibold leading-tight"
        :class="overdue ? 'text-danger' : 'text-ink'"
      >
        {{ title }}
      </p>
      <p class="text-[15px] leading-relaxed text-ink-body">
        {{ text }}
      </p>
    </section>

    <section class="flex flex-col gap-2 border-t border-line pt-5">
      <h2 class="font-label text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-soft">
        Quem está registrando
      </h2>
      <p class="text-[15px] font-semibold text-ink">
        {{ author }}
      </p>
      <p class="text-sm leading-normal text-ink-soft">
        Encarregada de proteção de dados
      </p>
      <p class="text-sm leading-relaxed text-ink-body">
        A requisição nasce marcada como registro por terceiro: seu usuário aparece na trilha de
        auditoria e na visão do titular, ao lado do canal informado.
      </p>
    </section>

    <section class="flex flex-col gap-2.5 border-t border-line pt-5">
      <h2 class="font-label text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-soft">
        O que acontece ao registrar
      </h2>
      <ol class="flex flex-col gap-2.5">
        <li
          v-for="(step, index) in steps"
          :key="step"
          class="flex gap-3"
        >
          <span class="min-w-[22px] font-label text-[13px] font-bold text-brand">
            {{ String(index + 1).padStart(2, '0') }}
          </span>
          <span class="text-[15px] leading-relaxed text-ink-body">{{ step }}</span>
        </li>
      </ol>
    </section>

    <p class="border-t border-line pt-5 text-sm leading-relaxed text-ink-soft">
      Registrar em nome de outra pessoa sem pedido comprovado é tratamento irregular. Sem
      verificação de identidade, não registre.
    </p>
  </aside>
</template>
