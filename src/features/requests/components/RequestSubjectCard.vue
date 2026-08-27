<script setup lang="ts">
import { RouterLink } from 'vue-router'

import BasePanel from '@/shared/ui/BasePanel.vue'
import { findRight } from '@/shared/constants/lgpdRights'
import { formatDate } from '@/shared/utils/date'
import { REQUEST_STATUS_LABELS } from '@/features/requests/constants/requestStatus'
import type { DataRequest, RequestSubject } from '@/features/requests/types/request'

/** Quem abriu o pedido, como a identidade foi conferida e o que mais já pediu. */
defineProps<{
  subject: RequestSubject
  /** Outras requisições do mesmo titular, para dar contexto ao atendimento. */
  others: readonly DataRequest[]
}>()
</script>

<template>
  <BasePanel eyebrow="Titular e verificação">
    <div class="flex flex-col gap-3.5 px-5 pb-5 pt-[18px]">
      <div class="flex flex-col gap-1">
        <p class="text-base font-semibold text-ink">
          {{ subject.name }}
        </p>
        <p class="break-words text-sm text-ink-muted">
          {{ subject.email }}
        </p>
        <p
          v-if="subject.document"
          class="text-sm text-ink-muted"
        >
          {{ subject.document }}
          <template v-if="subject.customerSince">
            · cadastro desde {{ subject.customerSince }}
          </template>
        </p>
      </div>

      <div
        v-if="subject.verifiedAt"
        class="flex flex-col gap-1 border border-brand-line bg-brand-wash px-3.5 py-3"
      >
        <p class="text-sm font-semibold text-brand">
          Identidade verificada
        </p>
        <p class="text-[13px] leading-normal text-ink-body">
          E-mail confirmado e documento conferido em {{ formatDate(subject.verifiedAt) }}.
        </p>
      </div>

      <div
        v-if="others.length > 0"
        class="flex flex-col gap-1"
      >
        <p class="font-label text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-faint">
          Outras requisições deste titular
        </p>
        <RouterLink
          v-for="other in others"
          :key="other.protocol"
          :to="{ name: 'request-detail', params: { protocol: other.protocol } }"
          class="text-[15px] font-medium text-brand no-underline hover:text-brand-strong"
        >
          {{ other.protocol }} · {{ findRight(other.rightNumeral)?.requestLabel }} ·
          {{ REQUEST_STATUS_LABELS[other.status].toLowerCase() }}
        </RouterLink>
      </div>
    </div>
  </BasePanel>
</template>
