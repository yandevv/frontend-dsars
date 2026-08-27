<script setup lang="ts">
import {
  REQUEST_STATUS_CLASSES,
  REQUEST_STATUS_LABELS,
} from '@/features/requests/constants/requestStatus'
import type { RequestStatus } from '@/features/requests/types/request'

/** Etiqueta do estado da requisição, com as cores da fila. */
defineProps<{ status: RequestStatus }>()
</script>

<template>
  <span
    class="inline-block border px-2.5 py-1.5 text-[13px] font-semibold"
    :class="REQUEST_STATUS_CLASSES[status]"
  >
    {{ REQUEST_STATUS_LABELS[status] }}
  </span>
</template>
