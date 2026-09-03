<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";

import RequestStatusChip from "@/features/requests/components/RequestStatusChip.vue";
import { DEADLINE_TEXT_CLASSES } from "@/features/requests/constants/deadlineStyles";
import { REQUEST_STATUS_LABELS, isOpen } from "@/features/requests/constants/requestStatus";
import { deadlineLabel, deadlineStatusOf } from "@/features/requests/utils/deadline";
import { findRight } from "@/shared/constants/lgpdRights";
import { formatDate } from "@/shared/utils/date";
import type { DataRequest, DeadlineStatus } from "@/features/requests/types/request";

/**
 * A lista do titular — tabela no computador, cartões no celular.
 *
 * O fundo da linha segue o prazo, não o estado: "Aguardando complemento" que
 * vence amanhã é mais urgente do que "Em análise" com nove dias pela frente,
 * e é o prazo que a pessoa precisa enxergar primeiro.
 */
const { requests } = defineProps<{ requests: readonly DataRequest[] }>();

const selected = defineModel<string[]>("selected", { required: true });

const ROW_BACKGROUND: Record<DeadlineStatus, string> = {
  vencida: "bg-danger-wash",
  proxima: "bg-due-soon-wash",
  "em-dia": "bg-surface",
  encerrada: "bg-surface-subtle",
};

const CARD_BORDER: Record<DeadlineStatus, string> = {
  vencida: "border-danger bg-danger-wash",
  proxima: "border-pending-line bg-pending-wash",
  "em-dia": "border-line bg-surface",
  encerrada: "border-line bg-surface-muted",
};

interface Row {
  request: DataRequest;
  open: boolean;
  right: string;
  registered: string;
  situation: DeadlineStatus;
  headline: string;
  detail: string;
}

const rows = computed<Row[]>(() =>
  requests.map((request) => {
    const situation = deadlineStatusOf(request);
    const open = isOpen(request.status);
    return {
      request,
      open,
      right: findRight(request.rightNumeral)?.requestLabel ?? request.rightNumeral,
      registered: `Registrada em ${formatDate(request.registeredAt)}`,
      situation,
      headline: open ? deadlineLabel(request) : closedHeadline(request),
      detail: open ? openDetail(request, situation) : closedDetail(request),
    };
  }),
);

function openDetail(request: DataRequest, situation: DeadlineStatus): string {
  return situation === "vencida"
    ? `Prazo era ${formatDate(request.dueAt)}`
    : `Prazo ${formatDate(request.dueAt)}`;
}

function closedHeadline(request: DataRequest): string {
  if (request.status === "cancelada") return "Encerrada pelo titular";
  const onTime = !request.closedAt || request.closedAt <= request.dueAt;
  return onTime ? "Encerrada no prazo" : "Encerrada com atraso";
}

function closedDetail(request: DataRequest): string {
  const when = request.closedAt ? formatDate(request.closedAt) : "";
  return request.status === "cancelada" ? `Cancelada em ${when}` : `Respondida em ${when}`;
}

const openIds = computed(() => rows.value.filter((row) => row.open).map((row) => row.request.id));
const allSelected = computed(
  () => openIds.value.length > 0 && openIds.value.every((id) => selected.value.includes(id)),
);

function toggleAll() {
  selected.value = allSelected.value ? [] : [...openIds.value];
}

function detailRoute(request: DataRequest) {
  return { name: "my-request-detail", params: { id: request.id } };
}
</script>

<template>
  <!-- Computador -->
  <div class="hidden border border-line lg:block">
    <table class="w-full border-collapse text-left">
      <caption class="sr-only">
        Suas requisições, das mais urgentes para as encerradas
      </caption>
      <thead class="border-b border-line bg-surface-muted">
        <tr>
          <th scope="col" class="w-[52px] py-3.5 pl-4">
            <input
              type="checkbox"
              class="size-[18px] accent-brand"
              :checked="allSelected"
              :disabled="openIds.length === 0"
              aria-label="Selecionar todas as requisições em andamento"
              @change="toggleAll"
            />
          </th>
          <th
            v-for="heading in ['Protocolo', 'Direito exercido', 'Estado', 'Prazo de resposta']"
            :key="heading"
            scope="col"
            class="font-label text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-soft"
          >
            {{ heading }}
          </th>
          <th scope="col">
            <span class="sr-only">Ação</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in rows"
          :key="row.request.id"
          class="border-b border-line-soft last:border-b-0"
          :class="ROW_BACKGROUND[row.situation]"
        >
          <td class="py-[18px] pl-4">
            <input
              type="checkbox"
              class="size-[18px] accent-brand"
              v-model="selected"
              v-model="selected"
              :value="row.request.id"
              :disabled="!row.open"lecionar a requisição ${row.request.protocol}`"
            />
          </td>
          <td class="w-[150px] font-label text-[15px] font-semibold text-ink">
            {{ row.request.protocol }}
          </td>
          <td class="py-3 pr-5">
            <p class="text-base font-semibold text-ink">
              {{ row.right }}
            </p>
            <p class="text-[13px] text-ink-muted">
              {{ row.registered }}
            </p>
          </td>
          <td class="w-[196px]">
            <RequestStatusChip :status="row.request.status" />
          </td>
          <td class="w-[228px]">
            <p class="text-[15px] font-semibold" :class="DEADLINE_TEXT_CLASSES[row.situation]">
              {{ row.headline }}
            </p>
            <p class="text-[13px] text-ink-muted">
              {{ row.detail }}
            </p>
          </td>
          <td class="w-[92px] pr-4 text-right">
            <RouterLink
              :to="detailRoute(row.request)"
              class="text-[15px] font-medium text-brand no-underline hover:text-brand-strong"
            >
              Abrir<span class="sr-only"> a requisição {{ row.request.protocol }}</span>
            </RouterLink>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Celular -->
  <div class="flex flex-col gap-3 lg:hidden">
    <label
      class="flex cursor-pointer items-center justify-between gap-3 border border-line bg-surface-muted px-3.5 py-3"
    >
      <span class="flex items-center gap-2.5">
        <input
          type="checkbox"
          class="size-[18px] accent-brand"
          :checked="allSelected"
          :disabled="openIds.length === 0"
          @change="toggleAll"
        />
        <span class="text-sm font-semibold text-ink">Selecionar várias</span>
      </span>
      <span class="text-[13px] text-ink-muted">
        {{ requests.length }} {{ requests.length === 1 ? "pedido" : "pedidos" }}
      </span>
    </label>

    <ul class="flex flex-col gap-3">
      <li
        v-for="row in rows"
        :key="row.request.id"
        class="flex flex-col gap-2.5 border p-4"
        :class="CARD_BORDER[row.situation]"
      >
        <div class="flex items-start justify-between gap-3">
          <span class="font-label text-sm font-semibold text-ink">{{ row.request.protocol }}</span>
          <input
            type="checkbox"
            class="size-[18px] shrink-0 accent-brand"
            v-model="selected"
            :value="row.request.id"
            :disabled="!row.open"
            :art
            v-model="selecied"a-label="`Selecionar a requisição ${row.request.protocol}`"
          />
        </div>] font-semibold text-ink">
          {{ row.right }}
        </p>
        <p class="text-[15px] font-semibold" :class="DEADLINE_TEXT_CLASSES[row.situation]">
          {{ row.headline }}
        </p>
        <p class="text-[13px] text-ink-muted">
          {{ row.detail }} · {{ row.registered.toLowerCase() }}
        </p>
        <div class="flex items-center justify-between gap-3 border-t border-line-soft pt-2.5">
          <span class="text-[13px] font-semibold text-ink-soft">
            {{ REQUEST_STATUS_LABELS[row.request.status] }}
          </span>
          <RouterLink :to="detailRoute(row.request)" class="text-[15px] font-medium text-brand">
            Abrir<span class="sr-only"> a requisição {{ row.request.protocol }}</span>
          </RouterLink>
        </div>
      </li>
    </ul>
  </div>
</template>
