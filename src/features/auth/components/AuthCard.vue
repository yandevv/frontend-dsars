<script setup lang="ts">
import { RouterLink } from 'vue-router'

import AuthChrome from '@/features/auth/components/AuthChrome.vue'
import { useTenant } from '@/features/tenant/composables/useTenant'

/**
 * Moldura das telas avulsas de acesso — recuperação, redefinição, retorno do
 * Google: cabeçalho público, um cartão centrado e o link para entrar.
 */
const { tenant } = useTenant()
</script>

<template>
  <AuthChrome
    :tenant="tenant"
    tagline="Atendimento a requisições de titulares de dados"
  >
    <template #action>
      <RouterLink
        :to="{ name: 'login' }"
        class="border border-line-button px-3.5 py-3 text-sm font-medium text-brand no-underline hover:border-brand md:px-[18px] md:py-[11px] md:text-[15px]"
      >
        Entrar
      </RouterLink>
    </template>

    <main
      id="conteudo-principal"
      tabindex="-1"
      class="flex flex-1 items-start justify-center bg-surface-muted px-5 py-7 md:px-14 md:py-16"
    >
      <div
        class="flex w-full max-w-[560px] flex-col gap-[22px] border border-line bg-surface px-5 pb-8 pt-7 md:gap-[26px] md:px-12 md:pb-12 md:pt-11"
      >
        <slot />
      </div>
    </main>
  </AuthChrome>
</template>
