<script setup lang="ts">
import { RouterLink } from 'vue-router'

import RequestStatusChip from '@/features/requests/components/RequestStatusChip.vue'
import {
  DEADLINE_ROW_CLASSES,
  DEADLINE_TEXT_CLASSES,
} from '@/features/requests/constants/deadlineStyles'
import { deadlineLabel, deadlineStatusOf } from '@/features/requests/utils/deadline'
import { findRight } from '@/shared/constants/lgpdRights'
import { formatDate } from '@/shared/utils/date'
import type { DataRequest } from '@/features/requests/types/request'

/**
 * A mesma fila em cartões, para telas estreitas.
 *
 * A seleção múltipla sai de cena aqui, como no design: ler a fila e abrir uma
 * requisição bastam, e caixas de seleção num cartão de 360 px roubariam o
 * espaço do prazo, que é a informação que faz alguém agir.
 */
defineProps<{ requests: readonly DataRequest[] }>()
</script>

<template>
  <ul class="flex flex-col gap-3">
    <li
      v-for="request in requests"
      :key="request.protocol"
      class="flex flex-col gap-2 border border-line border-l-[3px] px-4 py-3.5"
      :class="DEADLINE_ROW_CLASSES[deadlineStatusOf(request)]"
    >
      <div class="flex items-baseline justify-between gap-3">
        <p class="font-label text-[15px] font-semibold text-ink">
          {{ request.protocol }}
        </p>
        <p
          class="text-sm"
          :class="DEADLINE_TEXT_CLASSES[deadlineStatusOf(request)]"
        >
          {{ deadlineLabel(request) }}
        </p>
      </div>
      <p class="text-base font-semibold text-ink">
        {{ findRight(request.rightNumeral)?.requestLabel }}
      </p>
      <p class="text-sm text-ink-soft">
        {{ request.subject.name }} · registrada em {{ formatDate(request.registeredAt) }}
      </p>
      <div class="flex items-center justify-between gap-3">
        <RequestStatusChip :status="request.status" />
        <RouterLink
          :to="{ name: 'request-detail', params: { protocol: request.protocol } }"
          class="text-[15px] font-semibold text-brand underline"
        >
          Acessar<span class="sr-only"> a requisição {{ request.protocol }}</span>
        </RouterLink>
      </div>
    </li>
  </ul>
</template>
