<script setup lang="ts">
import { RouterLink } from 'vue-router'

import { PLATFORM_NAME } from '@/shared/constants/platform'
import type { Tenant } from '@/features/tenant/types/tenant'

/** Rodapé das telas autenticadas — o mesmo par de documentos legais do portal. */
defineProps<{ tenant: Tenant }>()
</script>

<template>
  <footer
    class="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 border-t border-line px-5 py-5 lg:px-10"
  >
    <p class="text-[13px] text-ink-muted">
      {{ tenant.name }} · Portal operado com a plataforma {{ PLATFORM_NAME }}.
    </p>
    <nav aria-label="Documentos legais">
      <ul class="flex gap-[22px]">
        <li>
          <RouterLink
            :to="{ name: 'terms' }"
            class="text-sm text-brand hover:text-brand-strong"
          >
            Termos de uso
          </RouterLink>
        </li>
        <li>
          <RouterLink
            :to="{ name: 'privacy' }"
            class="text-sm text-brand hover:text-brand-strong"
          >
            Aviso de privacidade
          </RouterLink>
        </li>
      </ul>
    </nav>
  </footer>
</template>
