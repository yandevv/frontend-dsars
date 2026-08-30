<script setup lang="ts">
import BasePanel from '@/shared/ui/BasePanel.vue'
import { REQUEST_OUTCOME_LABELS } from '@/features/requests/constants/requestStatus'
import { formatDateTime } from '@/shared/utils/date'
import type { RequestAnswer } from '@/features/requests/types/request'

/** A resposta já enviada, em leitura: é o que o titular recebeu, palavra por palavra. */
defineProps<{ answer: RequestAnswer }>()
</script>

<template>
  <BasePanel
    eyebrow="Resposta enviada ao titular"
    tone="brand"
  >
    <template #action>
      <p class="text-sm text-ink-soft">
        {{ REQUEST_OUTCOME_LABELS[answer.outcome] }} · {{ formatDateTime(answer.sentAt) }} ·
        {{ answer.author }}
      </p>
    </template>

    <div class="flex flex-col gap-4 p-[22px]">
      <p class="max-w-[76ch] text-[17px] leading-relaxed text-ink-body">
        {{ answer.text }}
      </p>

      <div
        v-if="answer.legalBasis"
        class="flex flex-col gap-1 border-l-[3px] border-line py-1 pl-4"
      >
        <p class="font-label text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-faint">
          Fundamento informado
        </p>
        <p class="text-[15px] leading-normal text-ink-body">
          {{ answer.legalBasis }}
        </p>
      </div>

      <p class="text-sm leading-relaxed text-ink-soft">
        O titular recebeu notificação no portal e por e-mail, e a pesquisa de satisfação desta
        requisição foi liberada.
      </p>
    </div>
  </BasePanel>
</template>
