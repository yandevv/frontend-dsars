<script setup lang="ts">
import { computed } from 'vue'

import { findOriginChannel } from '@/features/requests/constants/originChannels'
import { formatDate } from '@/shared/utils/date'
import type { DataRequest, RequestOrigin } from '@/features/requests/types/request'

/**
 * O aviso ao titular de que a requisição foi registrada pela encarregada.
 *
 * A origem fica explícita porque é o que permite contestar um registro que a
 * pessoa não fez: o titular lê por onde o pedido chegou, quando e quem o
 * registrou.
 */
const { request } = defineProps<{ request: DataRequest & { origin: RequestOrigin } }>()

const text = computed(() => {
  const { origin } = request
  const reference = origin.reference ? ` (${origin.reference})` : ''
  return `Recebido ${findOriginChannel(origin.channel).phrase}${reference} e registrado pela encarregada em ${formatDate(request.registeredAt)}. Se você não reconhece este pedido, avise a encarregada.`
})
</script>

<template>
  <section
    class="flex flex-col gap-1 border-l-[3px] border-ink-muted bg-surface-muted px-[18px] py-4"
    aria-labelledby="titulo-origem-registro"
  >
    <h2
      id="titulo-origem-registro"
      class="text-base font-semibold text-ink"
    >
      Registrada pela encarregada a seu pedido
    </h2>
    <p class="max-w-[78ch] text-[15px] leading-relaxed text-ink-body">
      {{ text }}
    </p>
  </section>
</template>
