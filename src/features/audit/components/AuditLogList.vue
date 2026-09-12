<script setup lang="ts">
import { RouterLink } from 'vue-router'

import {
  AUDIT_OPERATION_LABELS,
  AUDIT_OPERATION_STRIPES,
} from '@/features/audit/constants/auditOperations'
import { formatDateTime, relativeMoment } from '@/shared/utils/date'
import type { AuditEntry } from '@/features/audit/types/audit'

/**
 * Os registros da trilha — tabela no computador, cartões no celular.
 *
 * Só leitura: nenhuma linha tem ação além de abrir a requisição a que se
 * refere. Não há o que editar nem excluir, para ninguém.
 */
defineProps<{ entries: readonly AuditEntry[] }>()

function roleLabel(entry: AuditEntry): string {
  return entry.actorRole === 'titular' ? 'Titular' : 'Equipe de atendimento'
}
</script>

<template>
  <!-- Computador -->
  <div class="hidden border border-line lg:block">
    <table class="w-full border-collapse text-left">
      <caption class="sr-only">
        Registros da trilha de auditoria, do mais recente para o mais antigo
      </caption>
      <thead class="border-b border-line bg-surface-muted">
        <tr>
          <th
            v-for="heading in ['Quando', 'Quem', 'Operação', 'Recurso', 'Origem']"
            :key="heading"
            scope="col"
            class="px-4 py-3.5 font-label text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-soft"
          >
            {{ heading }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="entry in entries"
          :key="entry.id"
          class="border-b border-line-soft align-top last:border-b-0"
          :class="entry.operation === 'negado' ? 'bg-danger-wash' : 'bg-surface'"
        >
          <td class="w-[168px] px-4 py-4">
            <p class="text-[15px] text-ink">
              {{ relativeMoment(entry.at) }}
            </p>
            <p class="text-[13px] text-ink-faint">
              <time :datetime="entry.at">{{ formatDateTime(entry.at) }}</time>
            </p>
          </td>
          <td class="w-[220px] px-4 py-4">
            <p class="text-[15px] font-semibold text-ink">
              {{ entry.actor }}
            </p>
            <p class="text-[13px] text-ink-muted">
              {{ roleLabel(entry) }}
            </p>
          </td>
          <td class="px-4 py-4">
            <div class="flex gap-3">
              <span
                aria-hidden="true"
                class="w-[3px] shrink-0 self-stretch"
                :class="AUDIT_OPERATION_STRIPES[entry.operation]"
              />
              <div class="flex min-w-0 flex-col gap-1">
                <p class="font-label text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-soft">
                  {{ AUDIT_OPERATION_LABELS[entry.operation] }}
                </p>
                <p class="text-[15px] font-semibold text-ink">
                  {{ entry.action }}
                </p>
                <p class="max-w-[64ch] text-sm leading-relaxed text-ink-soft">
                  {{ entry.detail }}
                </p>
              </div>
            </div>
          </td>
          <td class="w-[170px] px-4 py-4">
            <RouterLink
              v-if="entry.resource.requestId"
              :to="{ name: 'request-detail', params: { id: entry.resource.requestId } }"
              class="font-label text-[15px] font-semibold text-brand hover:text-brand-strong"
            >
              {{ entry.resource.label }}
            </RouterLink>
            <p
              v-else
              class="text-[15px] text-ink"
            >
              {{ entry.resource.label }}
            </p>
          </td>
          <td class="w-[200px] px-4 py-4 text-sm leading-normal text-ink-soft">
            {{ entry.origin }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Celular -->
  <ul class="flex flex-col gap-3 lg:hidden">
    <li
      v-for="entry in entries"
      :key="entry.id"
      class="flex gap-3 border p-4"
      :class="entry.operation === 'negado' ? 'border-danger-line bg-danger-wash' : 'border-line bg-surface'"
    >
      <span
        aria-hidden="true"
        class="w-[3px] shrink-0 self-stretch"
        :class="AUDIT_OPERATION_STRIPES[entry.operation]"
      />
      <div class="flex min-w-0 flex-1 flex-col gap-1.5">
        <div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <p class="font-label text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-soft">
            {{ AUDIT_OPERATION_LABELS[entry.operation] }}
          </p>
          <time
            :datetime="entry.at"
            class="text-[13px] text-ink-faint"
          >{{ relativeMoment(entry.at) }}</time>
        </div>
        <p class="text-base font-semibold text-ink">
          {{ entry.action }}
        </p>
        <p class="break-words text-sm leading-relaxed text-ink-soft">
          {{ entry.detail }}
        </p>
        <p class="text-[13px] text-ink-muted">
          {{ entry.actor }} · {{ roleLabel(entry) }}
        </p>
        <div class="flex flex-wrap items-center justify-between gap-2 border-t border-line-soft pt-2">
          <RouterLink
            v-if="entry.resource.requestId"
            :to="{ name: 'request-detail', params: { id: entry.resource.requestId } }"
            class="font-label text-sm font-semibold text-brand"
          >
            {{ entry.resource.label }}
          </RouterLink>
          <span
            v-else
            class="text-sm text-ink"
          >{{ entry.resource.label }}</span>
          <span class="text-[13px] text-ink-muted">{{ entry.origin }}</span>
        </div>
      </div>
    </li>
  </ul>
</template>
