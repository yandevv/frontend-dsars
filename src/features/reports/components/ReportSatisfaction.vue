<script setup lang="ts">
import { MIN_SURVEY_RESPONSES } from '@/features/reports/constants/reportPolicy'
import type { ReportBar } from '@/features/reports/types/report'

/**
 * Pesquisa de satisfação agregada (RF011 no relatório).
 *
 * Abaixo de {@link MIN_SURVEY_RESPONSES} respostas a média e a distribuição
 * somem, e a tela diz por quê. Um recorte estreito — "eliminação de dados no mês
 * passado" — poderia apontar para quem respondeu, e a pesquisa foi prometida
 * anônima.
 */
const { responseCount } = defineProps<{
  visible: boolean
  responseCount: number
  average: string
  responseRate: string
  distribution: readonly ReportBar[]
}>()
</script>

<template>
  <section class="border border-line">
    <div
      class="flex flex-wrap items-baseline justify-between gap-4 border-b border-line px-[22px] py-4"
    >
      <h2 class="font-serif text-xl font-semibold text-ink">
        Pesquisa de satisfação
      </h2>
      <p class="text-sm text-ink-muted">
        {{ responseCount }} {{ responseCount === 1 ? 'resposta' : 'respostas' }} no recorte
      </p>
    </div>

    <div
      v-if="visible"
      class="grid items-stretch lg:grid-cols-[300px_minmax(0,1fr)]"
    >
      <div class="flex flex-col gap-1.5 border-b border-line-soft bg-surface-subtle px-[22px] py-6 lg:border-b-0 lg:border-r">
        <p class="font-label text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-soft">
          Nota média
        </p>
        <p class="flex items-baseline gap-2">
          <span class="font-label text-[46px] font-bold leading-none text-brand">{{ average }}</span>
          <span class="text-[17px] text-ink-soft">de 5</span>
        </p>
        <p class="text-sm leading-normal text-ink-soft">
          {{ responseCount }} respostas, sem vínculo com protocolo ou titular
        </p>
        <div class="mt-2.5 flex flex-col gap-1 border-t border-line pt-3.5">
          <p class="text-[15px] font-semibold text-ink">
            {{ responseRate }} de retorno
          </p>
          <p class="text-sm leading-normal text-ink-soft">
            Proporção entre requisições encerradas no recorte e pesquisas respondidas.
          </p>
        </div>
      </div>

      <div class="flex flex-col gap-3.5 px-[22px] pb-6 pt-[22px]">
        <div
          v-for="bar in distribution"
          :key="bar.label"
          class="grid grid-cols-[88px_minmax(0,1fr)_96px] items-center gap-3.5"
        >
          <p class="text-sm text-ink-body">
            {{ bar.label }}
          </p>
          <div
            aria-hidden="true"
            class="h-4 bg-track-bar"
          >
            <div
              class="h-4"
              :class="bar.color"
              :style="{ width: bar.width }"
            />
          </div>
          <p class="flex items-baseline justify-end gap-2">
            <span class="font-label text-[15px] font-bold text-ink">{{ bar.total }}</span>
            <span class="text-[13px] text-ink-muted">{{ bar.share }}</span>
          </p>
        </div>

        <div class="flex gap-3 border-t border-line-soft pt-3.5">
          <span
            aria-hidden="true"
            class="w-[3px] shrink-0 bg-ink-muted"
          />
          <p class="text-sm leading-relaxed text-ink-soft">
            As respostas chegam aqui sem vínculo com protocolo, titular ou responsável pelo
            atendimento. Os comentários livres não aparecem no relatório: ficam em uma lista
            separada, sem identificação.
          </p>
        </div>
      </div>
    </div>

    <div
      v-else
      class="flex gap-3.5 bg-surface-subtle px-[22px] py-[30px]"
    >
      <span
        aria-hidden="true"
        class="w-[3px] shrink-0 bg-due-soon"
      />
      <div class="flex flex-col gap-1.5">
        <p class="text-base font-semibold text-ink">
          Resultados ocultos para preservar o anonimato
        </p>
        <p class="max-w-[78ch] text-sm leading-relaxed text-ink-soft">
          Este recorte tem {{ responseCount }}
          {{ responseCount === 1 ? 'resposta' : 'respostas' }}. Abaixo de
          {{ MIN_SURVEY_RESPONSES }}, a média e a distribuição poderiam apontar para uma pessoa
          específica, então só o total é exibido. Amplie o período ou remova o filtro de direito.
        </p>
      </div>
    </div>
  </section>
</template>
