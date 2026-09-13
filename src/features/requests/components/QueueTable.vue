<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import RequestStatusChip from '@/features/requests/components/RequestStatusChip.vue'
import {
  DEADLINE_ROW_CLASSES,
  DEADLINE_TEXT_CLASSES,
} from '@/features/requests/constants/deadlineStyles'
import { abbreviateName } from '@/shared/utils/name'
import { deadlineLabel, deadlineStatusOf } from '@/features/requests/utils/deadline'
import { findRight } from '@/shared/constants/lgpdRights'
import { formatDate } from '@/shared/utils/date'
import { formatDue, requestIsImmediate } from '@/features/requests/utils/responseDeadline'
import type { DataRequest } from '@/features/requests/types/request'

/**
 * A fila em tabela, para telas largas.
 *
 * É uma `<table>` de verdade, e não a grade do design: cada linha é um registro
 * com as mesmas colunas, e é assim que um leitor de tela consegue dizer "Prazo
 * legal: venceu há 2 dias" em vez de ler seis textos soltos.
 */
const { requests } = defineProps<{ requests: readonly DataRequest[] }>()

const selected = defineModel<string[]>('selected', { required: true })

const headers = [
  'Protocolo',
  'Titular e direito',
  'Estado',
  'Prazo legal',
  'Registro e responsável',
]

const allSelected = computed(
  () => requests.length > 0 && selected.value.length === requests.length,
)

function toggleAll() {
  selected.value = allSelected.value ? [] : requests.map((request) => request.id)
}

function toggle(id: string) {
  selected.value = selected.value.includes(id)
    ? selected.value.filter((item) => item !== id)
    : [...selected.value, id]
}
</script>

<template>
  <table class="w-full table-fixed border-collapse border border-line text-left">
    <caption class="sr-only">
      Requisições da organização, com estado, prazo legal e responsável.
    </caption>
    <colgroup>
      <col class="w-[52px]">
      <col class="w-[142px]">
      <col>
      <col class="w-[210px]">
      <col class="w-[186px]">
      <col class="w-[200px]">
      <col class="w-[96px]">
    </colgroup>
    <thead class="border-b border-line bg-surface-muted">
      <tr>
        <th
          scope="col"
          class="px-4 py-3.5 text-center"
        >
          <input
            type="checkbox"
            class="size-[18px] accent-brand"
            :checked="allSelected"
            aria-label="Selecionar todas as requisições da fila"
            @change="toggleAll"
          >
        </th>
        <th
          v-for="header in headers"
          :key="header"
          scope="col"
          class="py-3.5 pr-4 font-label text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-soft"
        >
          {{ header }}
        </th>
        <th
          scope="col"
          class="px-4 py-3.5"
        >
          <span class="sr-only">Ação</span>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="request in requests"
        :key="request.id"
        class="border-b border-line-soft"
        :class="DEADLINE_ROW_CLASSES[deadlineStatusOf(request)]"
      >
        <td
          class="border-l-[3px] px-4 py-[18px] text-center"
          :class="DEADLINE_ROW_CLASSES[deadlineStatusOf(request)]"
        >
          <input
            type="checkbox"
            class="size-[18px] accent-brand"
            :checked="selected.includes(request.id)"
            :aria-label="`Selecionar a requisição ${request.protocol}`"
            @change="toggle(request.id)"
          >
        </td>
        <td class="py-[18px] pr-4 align-middle font-label text-[15px] font-semibold text-ink">
          {{ request.protocol }}
        </td>
        <td class="py-[18px] pr-5 align-middle">
          <p class="text-base font-semibold text-ink">
            {{ findRight(request.rightNumeral)?.requestLabel }}
          </p>
          <p class="text-sm text-ink-soft">
            {{ request.subject.name }}
          </p>
        </td>
        <td class="py-[18px] pr-4 align-middle">
          <RequestStatusChip :status="request.status" />
        </td>
        <td class="py-[18px] pr-4 align-middle">
          <p
            class="text-[15px]"
            :class="DEADLINE_TEXT_CLASSES[deadlineStatusOf(request)]"
          >
            {{ deadlineLabel(request) }}
          </p>
          <p class="text-[13px] text-ink-muted">
            {{ formatDue(request.dueAt, requestIsImmediate(request)) }}
          </p>
        </td>
        <td class="py-[18px] pr-4 align-middle">
          <p class="text-sm text-ink-body">
            Registrada em {{ formatDate(request.registeredAt) }}
          </p>
          <p class="text-[13px] text-ink-muted">
            {{ request.assignee ? abbreviateName(request.assignee) : 'Sem responsável' }}
          </p>
        </td>
        <td class="px-4 py-[18px] text-right align-middle">
          <RouterLink
            :to="{ name: 'request-detail', params: { id: request.id } }"
            class="text-[15px] font-semibold text-brand no-underline hover:text-brand-strong"
          >
            Acessar<span class="sr-only"> a requisição {{ request.protocol }}</span>
          </RouterLink>
        </td>
      </tr>
    </tbody>
  </table>
</template>
