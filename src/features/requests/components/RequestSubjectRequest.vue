<script setup lang="ts">
import BasePanel from '@/shared/ui/BasePanel.vue'
import { findRight } from '@/shared/constants/lgpdRights'
import type { DataRequest } from '@/features/requests/types/request'
import type { RequestAudience } from '@/features/requests/types/audience'

/** O pedido como o titular o escreveu, com os anexos que o acompanham (RF005 / RF012). */
// NOTA: os códigos de requisito ficam em comentário, nunca na tela — quem usa o
// sistema não tem por que ler a numeração do documento de requisitos do TCC.
const { request, audience = 'encarregado' } = defineProps<{
  request: DataRequest
  audience?: RequestAudience
}>()
</script>

<template>
  <BasePanel :eyebrow="audience === 'titular' ? 'Seu pedido' : 'Pedido do titular'">
    <div class="flex flex-col gap-5 px-[22px] pb-6 pt-[22px]">
      <p class="max-w-[76ch] text-[17px] leading-relaxed text-ink-body">
        {{ request.description }}
      </p>

      <dl class="grid gap-[18px] sm:grid-cols-3">
        <div class="flex flex-col gap-1">
          <dt class="font-label text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-faint">
            Direito exercido
          </dt>
          <dd class="text-[15px] text-ink">
            {{ findRight(request.rightNumeral)?.requestLabel }}
          </dd>
        </div>
        <div class="flex flex-col gap-1">
          <dt class="font-label text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-faint">
            Canal de registro
          </dt>
          <dd class="text-[15px] text-ink">
            {{ request.channel }}
          </dd>
        </div>
        <div
          v-if="request.unit"
          class="flex flex-col gap-1"
        >
          <dt class="font-label text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-faint">
            Unidade relacionada
          </dt>
          <dd class="text-[15px] text-ink">
            {{ request.unit }}
          </dd>
        </div>
      </dl>

      <div
        v-if="request.attachments.length > 0"
        class="flex flex-col border border-line"
      >
        <h3
          class="border-b border-line px-4 py-3 font-label text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-soft"
        >
          {{ audience === 'titular' ? 'Anexos enviados' : 'Anexos do titular' }}
        </h3>
        <div
          v-for="attachment in request.attachments"
          :key="attachment.name"
          class="flex items-center justify-between gap-4 border-b border-line-soft px-4 py-[13px] last:border-b-0"
        >
          <div class="flex flex-col gap-0.5">
            <p class="text-[15px] font-semibold text-ink">
              {{ attachment.name }}
            </p>
            <p class="text-[13px] text-ink-muted">
              {{ attachment.meta }}
            </p>
          </div>
          <button
            type="button"
            class="text-[15px] font-medium text-brand hover:text-brand-strong"
          >
            Baixar<span class="sr-only"> {{ attachment.name }}</span>
          </button>
        </div>
      </div>
    </div>
  </BasePanel>
</template>
