<script setup lang="ts">
import { computed } from 'vue'

import {
  deadlineFrom,
  deadlinePhrase,
  formatDue,
} from '@/features/requests/utils/responseDeadline'

/**
 * Coluna de apoio do registro por terceiro: o prazo que o pedido terá, quem
 * está registrando e o que acontece ao registrar.
 */
const { author, immediate } = defineProps<{
  author: string
  /** Resposta em até 24 horas do registro, em vez dos 15 dias. */
  immediate: boolean
}>()

const dueAt = computed(() => deadlineFrom(new Date().toISOString(), immediate))

const title = computed(() => `${deadlinePhrase(immediate)} · até ${formatDue(dueAt.value, immediate)}`)

const text = computed(() =>
  immediate
    ? 'Pedido de resposta imediata: são 24 horas contadas do registro.'
    : 'O prazo legal conta a partir do registro. Registre o pedido assim que ele chegar.',
)

const steps = [
  'O sistema gera protocolo e identificador únicos e começa a contar o prazo.',
  'A requisição aparece na lista do titular, com aviso de que foi registrada pela encarregada.',
  'A requisição entra na fila de atendimento da organização.',
]
</script>

<template>
  <aside
    class="hidden flex-col gap-[22px] border border-line bg-surface-muted px-[26px] pb-[30px] pt-[26px] lg:flex"
  >
    <section
      class="flex flex-col gap-2.5"
      
      aria-live="polite"
    >
      <h2 class="font-label text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-soft">
        Prazo desta requisição
      </h2>
      <p
        class="font-serif text-2xl font-semibold leading-tight text-ink"
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
        Encarregado de proteção de dados
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
