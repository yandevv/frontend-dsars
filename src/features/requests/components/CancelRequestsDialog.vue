<script setup lang="ts">
import { computed, ref, useId, watch } from "vue";

import BaseButton from "@/shared/ui/BaseButton.vue";
import BaseDialog from "@/shared/ui/BaseDialog.vue";
import BaseTextarea from "@/shared/ui/BaseTextarea.vue";
import {
  CANCEL_REASON_MAX_LENGTH,
  CANCEL_REASON_MIN_LENGTH,
} from "@/features/requests/constants/requestPolicy";
import { deadlineLabel } from "@/features/requests/utils/deadline";
import { findRight } from "@/shared/constants/lgpdRights";
import type { DataRequest } from "@/features/requests/types/request";

/**
 * O cancelamento, individual ou em lote, numa janela só.
 *
 * Uma confirmação e um motivo valem para todo o conjunto — é o que a lei pede
 * do cancelamento em lote, e é também o que evita pedir a mesma frase cinco
 * vezes a quem desistiu de cinco pedidos pelo mesmo motivo.
 */
const {
  requests,
  mode,
  sending = false,
} = defineProps<{
  /** O que vai ser cancelado; no modo individual, uma só. */
  requests: readonly DataRequest[];
  mode: "individual" | "lote";
  sending?: boolean;
}>();

const open = defineModel<boolean>("open", { required: true });

const emit = defineEmits<{ confirm: [reason: string] }>();

const reason = ref("");
const acknowledged = ref(false);
const attempted = ref(false);
const acknowledgeId = useId();

const batch = computed(() => mode === "lote");
const count = computed(() => requests.length);

// Cada abertura começa do zero: o motivo de um cancelamento desistido não
// deveria reaparecer no seguinte.
watch(open, (isOpen) => {
  if (!isOpen) return;
  reason.value = "";
  acknowledged.value = false;
  attempted.value = false;
});

const reasonOk = computed(() => reason.value.trim().length >= CANCEL_REASON_MIN_LENGTH);

const title = computed(() => {
  if (!batch.value) return `Cancelar a requisição ${requests[0]?.protocol ?? ""}?`;
  return count.value === 1 ? "Cancelar 1 requisição?" : `Cancelar ${count.value} requisições?`;
});

const lead = computed(() =>
  batch.value
    ? "A confirmação vale para todas as requisições abaixo e o motivo escrito aqui é registrado em cada uma delas. Concluídas e canceladas ficam de fora."
    : "O cancelamento é definitivo: a organização deixa de contar o prazo e não responderá a este pedido.",
);

const targets = computed(() =>
  requests.map((request) => ({
    id: request.id,
    protocol: request.protocol,
    right: findRight(request.rightNumeral)?.requestLabel ?? request.rightNumeral,
    deadline: deadlineLabel(request),
  })),
);

const acknowledgeLabel = computed(() =>
  batch.value && count.value > 1
    ? `Entendo que o cancelamento das ${count.value} é definitivo`
    : "Entendo que o cancelamento é definitivo",
);

const confirmLabel = computed(() => {
  if (sending) return batch.value && count.value > 1 ? `Cancelando ${count.value}…` : "Cancelando…";
  return batch.value && count.value > 1
    ? `Confirmar cancelamento das ${count.value}`
    : "Confirmar cancelamento";
});

function confirm() {
  if (sending) return;
  attempted.value = true;
  if (!reasonOk.value || !acknowledged.value) return;
  emit("confirm", reason.value.trim());
}
</script>

<template>
  <BaseDialog
    v-model:open="open"
    :title="title"
    :eyebrow="batch ? 'Cancelamento em lote' : 'Cancelamento individual'"
    tone="danger"
    :locked="sending"
  >
    <p class="text-base leading-relaxed text-ink-body">
      {{ lead }}
    </p>

    <section class="border border-line bg-surface-muted">
      <h3
        class="border-b border-line px-[18px] py-3 font-label text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-soft"
      >
        {{ batch ? "Requisições deste cancelamento" : "Requisição a cancelar" }}
      </h3>
      <ul>
        <li
          v-for="target in targets"
          :key="target.id"
          class="grid grid-cols-[110px_minmax(0,1fr)] gap-x-3.5 gap-y-0.5 border-b border-line-soft px-[18px] py-3 sm:grid-cols-[118px_minmax(0,1fr)_150px] sm:items-baseline"
        >
          <span class="font-label text-sm font-semibold text-ink">{{ target.protocol }}</span>
          <span class="text-[15px] text-ink-body">{{ target.right }}</span>
          <span class="col-start-2 text-sm text-ink-soft sm:col-start-auto">
            {{ target.deadline }}
          </span>
        </li>
      </ul>
      <p class="px-[18px] py-3 text-sm leading-normal text-ink-soft">
        {{
          batch
            ? "Se quiser cancelar apenas algumas, feche esta janela e ajuste a seleção na lista."
            : "Você pode registrar um novo pedido depois; o prazo recomeça na data do novo registro."
        }}
      </p>
    </section>

    <BaseTextarea
      v-model="reason"
      label="Motivo do cancelamento"
      required
      :rows="3"
      :maxlength="CANCEL_REASON_MAX_LENGTH"
      :disabled="sending"
      :description="
        batch
          ? `O mesmo motivo será registrado nas ${count} requisições.`
          : 'Uma frase basta. Ele fica no histórico da requisição.'
      "
      :hint="`Mínimo de ${CANCEL_REASON_MIN_LENGTH} caracteres.`"
      :error="
        attempted && !reasonOk
          ? `Escreva pelo menos ${CANCEL_REASON_MIN_LENGTH} caracteres.`
          : undefined
      "
      placeholder="Ex.: já obtive a informação por outro canal da unidade."
    />

    <label
      :for="acknowledgeId"
      class="flex cursor-pointer items-start gap-3 px-4 py-3.5"
      :class="
        attempted && !acknowledged
          ? 'border-2 border-danger bg-danger-wash'
          : 'border border-line bg-surface-muted'
      "
    >
      <input
        :id="acknowledgeId"
        v-model="acknowledged"
        type="checkbox"
        :disabled="sending"
        class="mt-0.5 size-5 shrink-0 accent-brand"
      />
      <span class="flex flex-col gap-1">
        <span class="text-[15px] font-semibold text-ink">{{ acknowledgeLabel }}</span>
        <span
          v-if="attempted && !acknowledged"
          class="text-[13px] leading-normal text-danger-strong"
        >
          A confirmação é obrigatória.
        </span>
        <span v-else class="text-sm leading-normal text-ink-soft">
          A organização deixa de contar o prazo e não responderá ao pedido. Você pode registrar um
          novo depois, com prazo recomeçando do zero.
        </span>
      </span>
    </label>

    <template #note> O cancelamento fica na trilha de auditoria com data, hora e motivo. </template>

    <template #actions>
      <BaseButton variant="secondary" :disabled="sending" @click="open = false">
        Manter requisição
      </BaseButton>
      <BaseButton variant="danger" :busy="sending" @click="confirm">
        {{ confirmLabel }}
      </BaseButton>
    </template>
  </BaseDialog>
</template>
