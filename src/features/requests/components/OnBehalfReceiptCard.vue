<script setup lang="ts">
import { computed } from 'vue'

import BaseButton from '@/shared/ui/BaseButton.vue'
import { findOriginChannel } from '@/features/requests/constants/originChannels'
import { findRight } from '@/shared/constants/lgpdRights'
import { downloadText } from '@/shared/utils/download'
import { formatDue } from '@/features/requests/utils/responseDeadline'
import { formatDate, formatDateTime } from '@/shared/utils/date'
import type { OnBehalfReceipt } from '@/features/requests/types/request'

/**
 * Comprovante do registro por terceiro.
 *
 * Além do protocolo e do prazo, mostra o vínculo: quem registrou, quando e por
 * qual canal o pedido chegou — é o que a trilha de auditoria guarda e o que
 * permite ao titular contestar um registro que não fez.
 */
const { receipt } = defineProps<{ receipt: OnBehalfReceipt }>()

defineEmits<{ restart: [] }>()

const channel = computed(() => findOriginChannel(receipt.origin.channel))
const right = computed(() => findRight(receipt.rightNumeral))

const lines = computed(() => [
  { label: 'Protocolo', value: receipt.protocol },
  { label: 'Titular', value: receipt.subjectName },
  { label: 'Direito exercido', value: right.value?.requestLabel ?? receipt.rightNumeral },
  {
    label: 'Canal de origem',
    value: receipt.origin.reference
      ? `${channel.value.label} · ${receipt.origin.reference}`
      : channel.value.label,
  },
  { label: 'Recebido em', value: formatDate(receipt.origin.receivedAt) },
  { label: 'Prazo legal', value: `até ${formatDue(receipt.dueAt, receipt.immediate)}` },
  {
    label: 'Registrado por',
    value: `${receipt.origin.registeredBy} · encarregada de dados · ${formatDateTime(receipt.registeredAt)}`,
  },
  { label: 'Identificador', value: receipt.id },
])

const subjectNotice = computed(() =>
  receipt.subjectHasAccount
    ? 'A requisição já aparece na lista do titular, com aviso de que foi registrada pela encarregada a pedido dele, e o protocolo foi enviado como notificação.'
    : 'O titular não tem conta no portal: entregue ou envie o comprovante com protocolo e prazo pelo mesmo canal em que o pedido chegou.',
)

/** O comprovante para entregar ao titular sem conta — protocolo, prazo e origem. */
function download() {
  const content = [
    `Comprovante de requisição · protocolo ${receipt.protocol}`,
    '',
    ...lines.value
      .filter((line) => line.label !== 'Identificador')
      .map((line) => `${line.label}: ${line.value}`),
    '',
    'Guarde este protocolo: ele identifica o pedido em qualquer contato com a organização ou com a ANPD.',
  ].join('\n')
  downloadText(`comprovante-${receipt.protocol}.txt`, content, 'text/plain')
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div
      role="status"
      class="flex flex-col gap-2.5 border-l-[3px] border-brand bg-brand-wash p-[22px] sm:p-[26px]"
    >
      <p class="font-label text-[11px] font-semibold uppercase tracking-[0.07em] text-brand">
        Requisição registrada
      </p>
      <h1 class="font-serif text-[26px] font-semibold leading-tight text-ink sm:text-[32px]">
        Protocolo {{ receipt.protocol }} criado em nome de {{ receipt.subjectName }}
      </h1>
      <p class="text-base leading-relaxed text-ink-body">
        A requisição entrou na fila com você como responsável, marcada como registro por terceiro.
        O prazo legal vai até {{ formatDue(receipt.dueAt, receipt.immediate) }}, contado do recebimento em
        {{ formatDate(receipt.origin.receivedAt) }}.
      </p>
    </div>

    <section
      class="border border-line"
      aria-labelledby="titulo-dados-registro"
    >
      <h2
        id="titulo-dados-registro"
        class="border-b border-line bg-surface-muted px-5 py-3.5 font-label text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-soft sm:px-6"
      >
        Dados do registro
      </h2>
      <dl>
        <div
          v-for="line in lines"
          :key="line.label"
          class="grid gap-1 border-b border-line-soft px-5 py-3.5 last:border-b-0 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-4 sm:px-6"
        >
          <dt class="text-sm text-ink-muted">
            {{ line.label }}
          </dt>
          <dd class="break-words text-[15px] font-medium text-ink">
            {{ line.value }}
          </dd>
        </div>
      </dl>
    </section>

    <div class="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
      <BaseButton :to="{ name: 'request-detail', params: { id: receipt.id } }">
        Abrir a requisição
      </BaseButton>
      <BaseButton
        variant="secondary"
        @click="$emit('restart')"
      >
        Registrar outra
      </BaseButton>
      <BaseButton
        variant="secondary"
        :to="{ name: 'request-queue' }"
      >
        Voltar à fila
      </BaseButton>
    </div>

    <section
      class="flex flex-col gap-2.5 border border-line px-5 py-5 sm:px-6"
      aria-labelledby="titulo-aviso-titular"
    >
      <h2
        id="titulo-aviso-titular"
        class="text-base font-semibold text-ink"
      >
        Comprovante para o titular
      </h2>
      <p class="text-[15px] leading-relaxed text-ink-body">
        {{ subjectNotice }}
      </p>
      <div>
        <BaseButton
          variant="secondary"
          size="sm"
          @click="download"
        >
          Baixar comprovante
        </BaseButton>
      </div>
    </section>

    <p class="flex gap-3 text-sm leading-relaxed text-ink-soft">
      <span
        aria-hidden="true"
        class="w-[3px] shrink-0 self-stretch bg-field-disabled-line"
      />
      Na trilha de auditoria: registro por terceiro · autora {{ receipt.origin.registeredBy }} ·
      {{ formatDateTime(receipt.registeredAt) }} · pedido recebido {{ channel.phrase }}. Arquive o
      documento original conforme a política de guarda.
    </p>
  </div>
</template>
