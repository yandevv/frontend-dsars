<script setup lang="ts">
import { computed } from 'vue'

import BaseButton from '@/shared/ui/BaseButton.vue'
import { LEGAL_DEADLINE_DAYS } from '@/features/requests/constants/requestPolicy'
import { findRight } from '@/shared/constants/lgpdRights'
import { formatDate, formatDateTime } from '@/shared/utils/date'
import type { RequestReceipt } from '@/features/requests/types/request'

/**
 * Comprovante do registro (RF004).
 *
 * O protocolo vem antes de tudo porque é o que o titular precisa guardar: é
 * com ele que se cobra a resposta, aqui ou numa reclamação à ANPD.
 *
 * O design oferecia três saídas daqui; a terceira, "Ver a requisição", levava à
 * página de acompanhamento do titular, que ainda não existe. Preferimos duas
 * saídas honestas a um botão que não leva a lugar nenhum.
 */
const { receipt } = defineProps<{ receipt: RequestReceipt }>()

defineEmits<{ restart: [] }>()

const right = computed(() => findRight(receipt.rightNumeral))

const attachmentSummary = computed(() => {
  if (receipt.attachmentCount === 0) return 'Sem anexos'
  return receipt.attachmentCount === 1 ? '1 anexo enviado' : `${receipt.attachmentCount} anexos enviados`
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <div
      role="status"
      class="flex flex-col gap-2.5 border-l-[3px] border-brand bg-brand-wash p-[26px]"
    >
      <p class="font-label text-[11px] font-semibold uppercase tracking-[0.07em] text-brand">
        Requisição registrada
      </p>
      <h1 class="font-serif text-[32px] font-semibold leading-tight text-ink">
        Recebemos seu pedido e o prazo já está contando
      </h1>
      <p class="text-base leading-relaxed text-ink-body">
        Guarde o protocolo: ele identifica esta requisição em qualquer contato com a organização
        ou com a ANPD.
      </p>
    </div>

    <dl class="border border-line">
      <div class="grid border-b border-line sm:grid-cols-2">
        <div class="flex flex-col gap-1 border-b border-line px-6 py-[22px] sm:border-b-0 sm:border-r">
          <dt class="text-[13px] text-ink-muted">
            Protocolo
          </dt>
          <dd class="font-label text-[26px] font-bold text-ink">
            {{ receipt.protocol }}
          </dd>
        </div>
        <div class="flex flex-col gap-1 px-6 py-[22px]">
          <dt class="text-[13px] text-ink-muted">
            Prazo de atendimento
          </dt>
          <dd class="font-label text-[26px] font-bold text-ink">
            {{ formatDate(receipt.dueAt) }}
          </dd>
          <dd class="text-sm text-ink-soft">
            {{ LEGAL_DEADLINE_DAYS }} dias corridos do registro
          </dd>
        </div>
      </div>

      <div class="flex flex-col gap-1 border-b border-line px-6 py-5">
        <dt class="text-[13px] text-ink-muted">
          Identificador interno
        </dt>
        <dd class="break-all font-label text-base text-ink-body">
          {{ receipt.id }}
        </dd>
      </div>

      <div class="grid sm:grid-cols-2">
        <div class="flex flex-col gap-1 border-b border-line px-6 py-5 sm:border-b-0 sm:border-r">
          <dt class="text-[13px] text-ink-muted">
            Direito exercido
          </dt>
          <dd class="text-base font-semibold text-ink">
            {{ right?.requestLabel }}
          </dd>
        </div>
        <div class="flex flex-col gap-1 px-6 py-5">
          <dt class="text-[13px] text-ink-muted">
            Registrada em
          </dt>
          <dd class="text-base font-semibold text-ink">
            {{ formatDateTime(receipt.registeredAt) }}
          </dd>
          <dd class="text-sm text-ink-soft">
            {{ attachmentSummary }}
          </dd>
        </div>
      </div>
    </dl>

    <div class="flex flex-wrap gap-2.5">
      <BaseButton :to="{ name: 'my-requests' }">
        Voltar à minha lista
      </BaseButton>
      <BaseButton
        variant="secondary"
        @click="$emit('restart')"
      >
        Registrar outro pedido
      </BaseButton>
    </div>
  </div>
</template>
