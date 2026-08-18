<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { PLATFORM_NAME } from '@/shared/constants/platform'
import type { Tenant } from '@/features/tenant/types/tenant'

defineProps<{ tenant: Tenant }>()
</script>

<template>
  <footer
    class="flex flex-col gap-3 px-5 py-6 pb-7 md:flex-row-reverse md:items-center md:justify-between md:gap-8 md:px-14 md:py-[26px]"
  >
    <nav
      aria-label="Documentos legais"
      class="flex justify-between gap-5 md:justify-start"
    >
      <RouterLink
        :to="{ name: 'terms' }"
        class="text-sm text-brand hover:text-brand-strong"
      >
        Termos de uso
      </RouterLink>
      <RouterLink
        :to="{ name: 'privacy' }"
        class="text-sm text-brand hover:text-brand-strong"
      >
        Aviso de privacidade
      </RouterLink>
    </nav>

    <p class="text-center text-xs leading-[1.6] text-ink-muted md:text-start md:text-[13px]">
      {{ tenant.name }} · CNPJ {{ tenant.registrationId }}.
      Portal operado com a plataforma {{ PLATFORM_NAME }}.
    </p>
  </footer>
</template>
