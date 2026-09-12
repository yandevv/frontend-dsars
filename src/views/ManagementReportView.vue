<script setup lang="ts">
import { computed } from 'vue'

import AppShell from '@/shared/layout/AppShell.vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import BaseSelect from '@/shared/ui/BaseSelect.vue'
import ReportBarChart from '@/features/reports/components/ReportBarChart.vue'
import ReportExportMenu from '@/features/reports/components/ReportExportMenu.vue'
import ReportIndicators from '@/features/reports/components/ReportIndicators.vue'
import ReportSatisfaction from '@/features/reports/components/ReportSatisfaction.vue'
import ReportSkeleton from '@/features/reports/components/ReportSkeleton.vue'
import { LEGAL_DEADLINE_DAYS } from '@/features/requests/constants/requestPolicy'
import { downloadText } from '@/shared/utils/download'
import { recordAccountEvent } from '@/features/audit/services/auditService'
import { useSession } from '@/features/auth/composables/useSession'
import { formatDateTime } from '@/shared/utils/date'
import { indicatorsToCsv, recordsToCsv } from '@/features/reports/utils/csv'
import { useManagementReport } from '@/features/reports/composables/useManagementReport'
import { useTenant } from '@/features/tenant/composables/useTenant'
import type { ExportFormat } from '@/features/reports/types/report'

/**
 * Turno 1 · Tela 14 — Relatório gerencial (RF028).
 *
 * Os números que a encarregada precisa defender diante da diretoria e da
 * autoridade. Todos são agregados: nada nesta tela identifica um titular, e a
 * satisfação some quando o recorte fica estreito o bastante para apontar para
 * quem respondeu.
 */
const { tenant } = useTenant()
const report = useManagementReport()

const apuratedAt = formatDateTime(new Date().toISOString())

const decimalAverage = computed(() =>
  report.averageRating.value.toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }),
)

const scope = computed(() => {
  const period = report.periodOptions.value.find((option) => option.value === report.period.value)
  return [
    period?.label.toLowerCase(),
    report.right.value === 'todos' ? 'todos os direitos' : null,
    report.status.value === 'todos' ? 'todos os estados' : null,
  ]
    .filter(Boolean)
    .join(' · ')
})

const { account } = useSession('encarregado')

const FORMAT_LABELS: Record<ExportFormat, string> = {
  pdf: 'Indicadores em PDF',
  csv: 'Indicadores em CSV',
  base: 'Base analítica anonimizada em CSV',
}

function exportReport(format: ExportFormat) {
  // A exportação entra na trilha com quem exportou e o período consultado.
  recordAccountEvent(account.value, {
    operation: 'exportacao',
    action: 'Relatório gerencial exportado',
    detail: `${FORMAT_LABELS[format]} · ${scope.value}.`,
    resource: { kind: 'relatorio', label: 'Relatório gerencial' },
  })

  if (format === 'pdf') {
    // O navegador já sabe transformar esta página em PDF, e o resultado sai com
    // o mesmo recorte que está na tela.
    window.print()
    return
  }

  if (format === 'csv') {
    downloadText(
      'relatorio-gerencial.csv',
      indicatorsToCsv(report.indicators.value, scope.value),
    )
    return
  }

  downloadText('base-analitica-anonimizada.csv', recordsToCsv(report.filtered.value))
}
</script>

<template>
  <AppShell role="encarregado">
    <div class="mx-auto flex max-w-[1360px] flex-col gap-6">
      <div class="flex flex-wrap items-start justify-between gap-8">
        <div class="flex max-w-[720px] flex-col gap-2">
          <h1 class="font-serif text-[32px] font-semibold leading-[1.15] text-ink">
            Relatório gerencial
          </h1>
          <p class="text-[15px] leading-relaxed text-ink-soft">
            Atendimento de requisições de titulares {{ tenant.article.toLowerCase() === 'o' ? 'no' : 'na' }}
            {{ tenant.name }}. Todos os números são agregados; nenhum indicador desta tela
            identifica titular ou respondente.
          </p>
        </div>
        <ReportExportMenu
          :scope="scope"
          @choose="exportReport"
        />
      </div>

      <section
        aria-label="Recorte do relatório"
        class="flex flex-wrap items-end gap-4 border border-line bg-surface-muted px-5 py-[18px]"
      >
        <BaseSelect
          v-model="report.period.value"
          label="Período"
          :options="report.periodOptions.value"
          class="min-w-[236px] flex-1"
        />

        <template v-if="report.period.value === 'personalizado'">
          <div class="flex flex-col gap-1.5">
            <label
              for="relatorio-de"
              class="font-label text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-soft"
            >De</label>
            <input
              id="relatorio-de"
              v-model="report.from.value"
              type="date"
              class="h-[46px] border border-field-line bg-surface px-[13px] text-[15px] text-ink"
            >
          </div>
          <div class="flex flex-col gap-1.5">
            <label
              for="relatorio-ate"
              class="font-label text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-soft"
            >Até</label>
            <input
              id="relatorio-ate"
              v-model="report.to.value"
              type="date"
              class="h-[46px] border border-field-line bg-surface px-[13px] text-[15px] text-ink"
            >
          </div>
        </template>

        <BaseSelect
          v-model="report.right.value"
          label="Direito exercido"
          :options="report.rightOptions.value"
          class="min-w-[248px] flex-1"
        />
        <BaseSelect
          v-model="report.status.value"
          label="Estado"
          :options="report.statusOptions.value"
          class="min-w-[224px] flex-1"
        />

        <button
          type="button"
          class="ml-auto py-3.5 text-sm text-brand underline hover:text-brand-strong"
          @click="report.clear"
        >
          Limpar filtros
        </button>
      </section>

      <div class="flex flex-wrap items-baseline justify-between gap-5">
        <p
          aria-live="polite"
          class="text-[15px] text-ink-soft"
        >
          {{ report.summary.value }}
        </p>
        <p class="text-sm text-ink-muted">
          Dados apurados em {{ apuratedAt }}
        </p>
      </div>

      <ReportSkeleton v-if="report.loading.value" />

      <div
        v-else-if="report.empty.value"
        class="flex flex-col items-center gap-3 border border-line bg-surface-subtle px-6 py-12 text-center"
      >
        <p class="font-serif text-[22px] font-semibold text-ink">
          Nenhuma requisição nesse recorte
        </p>
        <p class="max-w-[58ch] text-[15px] leading-relaxed text-ink-soft">
          Não há registros que combinem período, direito e estado. Amplie o período ou volte o
          direito para “Todos os direitos” — a base tem {{ report.records.value.length }}
          requisições registradas.
        </p>
        <BaseButton
          size="sm"
          @click="report.clear"
        >
          Limpar filtros
        </BaseButton>
      </div>

      <template v-else>
        <ReportIndicators :indicators="report.indicators.value" />

        <div class="grid gap-6 lg:grid-cols-2">
          <ReportBarChart
            title="Total por direito exercido"
            :bars="report.byRight.value"
          />
          <ReportBarChart
            title="Total por estado"
            :note="`situação em ${apuratedAt.slice(0, 5)}`"
            :bars="report.byStatus.value"
          >
            <div class="flex flex-col gap-1.5 border-t border-line-soft pt-3.5">
              <p class="text-[15px] font-semibold text-ink">
                {{ report.lateCount.value }} concluídas fora do prazo legal
              </p>
              <p class="text-sm leading-normal text-ink-soft">
                O prazo de {{ LEGAL_DEADLINE_DAYS }} dias corre do registro. Requisições canceladas
                pelo titular não entram no cálculo de prazo nem no tempo médio.
              </p>
            </div>
          </ReportBarChart>
        </div>

        <ReportSatisfaction
          :visible="report.satisfactionVisible.value"
          :response-count="report.ratings.value.length"
          :average="decimalAverage"
          :response-rate="report.responseRate.value"
          :distribution="report.ratingDistribution.value"
        />
      </template>

      <div class="flex flex-wrap items-center justify-between gap-5 border-t border-line-soft pt-[18px]">
        <p class="max-w-[76ch] text-sm leading-relaxed text-ink-muted">
          Relatório gerado a partir dos registros de atendimento. Serve de base ao relatório de
          impacto e às respostas à ANPD; a exportação fica registrada em auditoria.
        </p>
      </div>
    </div>
  </AppShell>
</template>
