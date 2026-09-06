<script setup lang="ts">
import BasePanel from '@/shared/ui/BasePanel.vue'
import { REQUEST_OUTCOME_LABELS } from '@/features/requests/constants/requestStatus'
import { formatDateTime } from '@/shared/utils/date'
import type { RequestAnswer } from '@/features/requests/types/request'
import type { RequestAudience } from '@/features/requests/types/audience'

/** A resposta já enviada, em leitura: é o que o titular recebeu, palavra por palavra. */
const { audience = 'encarregado' } = defineProps<{
  answer: RequestAnswer
  audience?: RequestAudience
}>()
</script>

<template>
  <BasePanel
    :eyebrow="audience === 'titular' ? 'Resposta da organização' : 'Resposta enviada ao titular'"
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

      <ul
        v-if="answer.attachments?.length"
        class="flex flex-col gap-2"
      >
        <li
          v-for="attachment in answer.attachments"
          :key="attachment.name"
          class="flex flex-wrap items-center justify-between gap-3 border border-line px-4 py-2.5"
        >
          <span class="flex flex-col gap-0.5">
            <span class="text-[15px] font-semibold text-ink">{{ attachment.name }}</span>
            <span class="text-[13px] text-ink-muted">{{ attachment.meta }}</span>
          </span>
          <span class="text-[15px] font-medium text-brand">Baixar</span>
        </li>
      </ul>

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

      <p
        v-if="audience === 'titular'"
        class="text-sm leading-relaxed text-ink-soft"
      >
        Esta é a resposta final ao seu pedido. Se precisar reabrir o assunto, registre uma nova
        requisição — ela nasce com prazo próprio.
      </p>
      <p
        v-else
        class="text-sm leading-relaxed text-ink-soft"
      >
        O titular recebeu notificação no portal e por e-mail, e a pesquisa de satisfação desta
        requisição foi liberada.
      </p>
    </div>
  </BasePanel>
</template>
