<script setup lang="ts">
import { computed, ref } from 'vue'

import AppBreadcrumb from '@/shared/layout/AppBreadcrumb.vue'
import AppShell from '@/shared/layout/AppShell.vue'
import NewRequestAside from '@/features/requests/components/NewRequestAside.vue'
import NewRequestForm from '@/features/requests/components/NewRequestForm.vue'
import RequestReceiptAside from '@/features/requests/components/RequestReceiptAside.vue'
import RequestReceiptCard from '@/features/requests/components/RequestReceiptCard.vue'
import { findRight } from '@/shared/constants/lgpdRights'
import type { RequestReceipt } from '@/features/requests/types/request'

/**
 * Turno 1 · Tela 6 — Nova requisição (RF004, art. 18 da LGPD).
 *
 * Duas fases na mesma rota, como no design: o formulário e, no lugar dele, o
 * comprovante. Não são duas telas porque o comprovante só existe como
 * consequência do envio — chegar nele por um endereço próprio significaria
 * poder abri-lo sem ter registrado nada.
 */
const receipt = ref<RequestReceipt | null>(null)

/** O direito escolhido no formulário, para o prazo na coluna de apoio. */
const chosenNumeral = ref('')

const chosenRight = computed(() => findRight(chosenNumeral.value))

function onRegistered(registered: RequestReceipt) {
  receipt.value = registered
}

function restart() {
  receipt.value = null
  chosenNumeral.value = ''
}
</script>

<template>
  <AppShell
    v-slot="{ account }"
    role="titular"
  >
    <div class="mx-auto flex max-w-[1200px] flex-col gap-6">
      <AppBreadcrumb
        :trail="[{ label: 'Minhas requisições', to: { name: 'my-requests' } }]"
        current="Nova requisição"
      />

      <div class="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_396px]">
        <template v-if="receipt">
          <RequestReceiptCard
            :receipt="receipt"
            @restart="restart"
          />
          <RequestReceiptAside :email="account.email" />
        </template>
        <template v-else>
          <NewRequestForm
            v-model:right="chosenNumeral"
            :account="account"
            @registered="onRegistered"
          />
          <NewRequestAside :right="chosenRight" />
        </template>
      </div>
    </div>
  </AppShell>
</template>
