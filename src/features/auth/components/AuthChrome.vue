<script setup lang="ts">
import { RouterLink } from 'vue-router'

import TenantBrand from '@/shared/ui/TenantBrand.vue'
import { PLATFORM_NAME } from '@/shared/constants/platform'
import type { Tenant } from '@/features/tenant/types/tenant'

/**
 * Cabeçalho e rodapé comuns às telas de conta.
 *
 * Existe separado de `AuthLayout` porque nem toda tela de conta tem duas
 * colunas: a confirmação de e-mail é um quadro único centralizado, e só
 * aproveita esta moldura.
 */
const { tenant, tagline, tone = 'light-surface' } = defineProps<{
  tenant: Tenant
  /** Descrição própria do cabeçalho, quando a tela tem assunto próprio. */
  tagline?: string
  /** `dark-surface`: cabeçalho preto, como na tela de convite. */
  tone?: 'light-surface' | 'dark-surface'
}>()
</script>

<template>
  <div class="mx-auto flex min-h-dvh w-full max-w-7xl flex-col">
    <header
      class="flex items-center justify-between gap-4 px-5 py-3.5 md:px-14 md:py-[18px]"
      :class="tone === 'dark-surface' ? 'bg-ink' : 'border-b border-line'"
    >
      <TenantBrand
        :tenant="tenant"
        :tagline="tagline"
        :tone="tone"
      />

      <div class="flex items-center gap-3.5">
        <slot name="action" />
      </div>
    </header>

    <slot />

    <footer
      class="flex flex-col gap-3 border-t border-line px-5 py-6 md:flex-row-reverse md:items-center md:justify-between md:gap-8 md:px-14 md:py-[22px]"
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
        {{ tenant.name }} · Portal operado com a plataforma {{ PLATFORM_NAME }}.
      </p>
    </footer>
  </div>
</template>
