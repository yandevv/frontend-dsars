<script setup lang="ts">
import { ref } from 'vue'

import AppShell from '@/shared/layout/AppShell.vue'
import AuditFilters from '@/features/audit/components/AuditFilters.vue'
import AuditLogList from '@/features/audit/components/AuditLogList.vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import { AUDIT_RETENTION_YEARS } from '@/features/audit/constants/auditOperations'
import { downloadText } from '@/shared/utils/download'
import { useAuditLog } from '@/features/audit/composables/useAuditLog'
import type { Account } from '@/features/auth/types/auth'

/**
 * Registros de auditoria (RNF de trilha imutável, RN083 a RN085).
 *
 * Sem design no projeto: segue a linguagem da fila — filtros no alto, com o
 * recorte na URL, e a lista embaixo. A tela é só de leitura; a única ação é
 * exportar, e a exportação também entra na trilha.
 */
const audit = useAuditLog()
const exporting = ref(false)
const notice = ref('')

async function exportCsv(account: Account) {
  exporting.value = true
  try {
    const count = audit.filtered.value.length
    const csv = await audit.exportCsv({ actor: account.name })
    downloadText('trilha-de-auditoria.csv', csv)
    notice.value = `${count} registros exportados. A exportação foi registrada na própria trilha.`
  } finally {
    exporting.value = false
  }
}
</script>

<template>
  <AppShell
    v-slot="{ account }"
    role="encarregado"
  >
    <div class="mx-auto flex max-w-[1360px] flex-col gap-[22px]">
      <div class="flex flex-wrap items-start justify-between gap-6">
        <div class="flex max-w-[760px] flex-col gap-2">
          <h1 class="font-serif text-[26px] font-semibold leading-[1.15] text-ink sm:text-[32px]">
            Registros de auditoria
          </h1>
          <p class="text-[15px] leading-relaxed text-ink-soft">
            Quem fez o quê, sobre qual recurso e quando — nas requisições e nas contas. É com esta
            trilha que a organização demonstra o atendimento ao titular e à ANPD.
          </p>
        </div>
        <BaseButton
          variant="secondary"
          size="sm"
          :busy="exporting"
          :disabled="audit.loading.value || audit.filtered.value.length === 0"
          @click="exportCsv(account)"
        >
          {{ exporting ? 'Exportando…' : 'Exportar CSV' }}
        </BaseButton>
      </div>

      <section
        class="flex items-start gap-3.5 border border-line bg-surface-muted px-5 py-4"
        aria-label="Sobre a trilha"
      >
        <span
          aria-hidden="true"
          class="w-[3px] shrink-0 self-stretch bg-ink-muted"
        />
        <p class="max-w-[100ch] text-sm leading-relaxed text-ink-body">
          Os registros não podem ser editados nem excluídos por nenhum perfil, inclusive o da
          encarregada, e ficam guardados por no mínimo {{ AUDIT_RETENTION_YEARS }} anos. Mensagens
          editadas ou excluídas na conversa aparecem aqui com o conteúdo original.
        </p>
      </section>

      <div
        v-if="notice"
        role="status"
        class="flex flex-wrap items-center gap-3.5 border border-line-button bg-surface-muted py-4 pl-4 pr-5"
      >
        <span
          aria-hidden="true"
          class="w-[3px] self-stretch bg-brand"
        />
        <p class="flex-1 text-[15px] leading-normal text-ink-body">
          {{ notice }}
        </p>
        <button
          type="button"
          class="py-1 text-sm text-brand underline hover:text-brand-strong"
          @click="notice = ''"
        >
          Fechar
        </button>
      </div>

      <AuditFilters
        v-model:search="audit.search.value"
        v-model:period="audit.period.value"
        v-model:actor="audit.actor.value"
        v-model:operation="audit.operation.value"
        :period-options="audit.periodOptions"
        :actor-options="audit.actorOptions.value"
        :operation-options="audit.operationOptions"
        @clear="audit.clear"
      />

      <div
        v-if="audit.loading.value"
        role="status"
        class="flex flex-col border border-line"
      >
        <div
          v-for="width in ['62%', '48%', '70%', '40%', '56%']"
          :key="width"
          aria-hidden="true"
          class="flex items-center gap-6 border-b border-line-soft px-4 py-[18px] last:border-b-0"
        >
          <span class="h-3.5 w-[110px] shrink-0 bg-skeleton" />
          <span class="hidden h-3.5 w-[150px] shrink-0 bg-skeleton sm:block" />
          <span class="flex flex-1 flex-col gap-2">
            <span
              class="block h-3.5 bg-skeleton"
              :style="{ width }"
            />
            <span class="block h-[11px] w-[45%] bg-track-bar" />
          </span>
        </div>
        <span class="sr-only">Carregando a trilha de auditoria…</span>
      </div>

      <template v-else>
        <p
          class="text-sm text-ink-muted"
          aria-live="polite"
        >
          <template v-if="audit.isFiltered.value">
            {{ audit.filtered.value.length }} de {{ audit.entries.value.length }} registros ·
            {{ audit.scope.value }}
          </template>
          <template v-else>
            {{ audit.entries.value.length }} registros, do mais recente para o mais antigo
          </template>
        </p>

        <div
          v-if="audit.filtered.value.length === 0"
          class="flex flex-col items-start gap-3 border border-line px-6 py-8"
        >
          <h2 class="font-serif text-[22px] font-semibold text-ink">
            Nenhum registro neste recorte
          </h2>
          <p class="max-w-[64ch] text-[15px] leading-relaxed text-ink-soft">
            Amplie o período ou tire um dos filtros. A trilha guarda tudo o que aconteceu — se não
            aparece aqui, é o recorte que está estreito.
          </p>
          <BaseButton
            variant="secondary"
            size="sm"
            @click="audit.clear"
          >
            Limpar filtros
          </BaseButton>
        </div>

        <AuditLogList
          v-else
          :entries="audit.filtered.value"
        />
      </template>
    </div>
  </AppShell>
</template>
