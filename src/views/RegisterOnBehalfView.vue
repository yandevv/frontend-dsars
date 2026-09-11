<script setup lang="ts">
import { ref } from 'vue'

import AppBreadcrumb from '@/shared/layout/AppBreadcrumb.vue'
import AppShell from '@/shared/layout/AppShell.vue'
import OnBehalfAside from '@/features/requests/components/OnBehalfAside.vue'
import OnBehalfForm from '@/features/requests/components/OnBehalfForm.vue'
import OnBehalfReceiptCard from '@/features/requests/components/OnBehalfReceiptCard.vue'
import { todayInput } from '@/features/requests/utils/onBehalf'
import type { OnBehalfReceipt } from '@/features/requests/types/request'

/**
 * Turno 1 · Tela 13 — Registrar requisição em nome do titular (RF004 / RN018).
 *
 * Como a nova requisição do titular, duas fases na mesma rota: o formulário e,
 * no lugar dele, o comprovante. `formKey` remonta o formulário em "Registrar
 * outra", para que nada do registro anterior sobre nos campos.
 */
const receipt = ref<OnBehalfReceipt | null>(null)
const rightNumeral = ref('')
const receivedOn = ref(todayInput())
const formKey = ref(0)

function onRegistered(registered: OnBehalfReceipt) {
  receipt.value = registered
  // O formulário é longo: o comprovante começa no alto da página.
  window.scrollTo?.({ top: 0 })
}

function restart() {
  receipt.value = null
  rightNumeral.value = ''
  receivedOn.value = todayInput()
  formKey.value += 1
}
</script>

<template>
  <AppShell
    v-slot="{ account }"
    role="encarregado"
  >
    <div class="mx-auto flex max-w-[1280px] flex-col gap-6">
      <AppBreadcrumb
        :trail="[{ label: 'Fila de atendimento', to: { name: 'request-queue' } }]"
        current="Registrar em nome do titular"
      />

      <div
        v-if="receipt"
        class="max-w-[880px]"
      >
        <OnBehalfReceiptCard
          :receipt="receipt"
          @restart="restart"
        />
      </div>
      <div
        v-else
        class="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_380px]"
      >
        <OnBehalfForm
          :key="formKey"
          v-model:right="rightNumeral"
          v-model:received-on="receivedOn"
          :author="account.name"
          @registered="onRegistered"
        />
        <OnBehalfAside
          :received-on="receivedOn"
          :author="account.name"
        />
      </div>
    </div>
  </AppShell>
</template>
