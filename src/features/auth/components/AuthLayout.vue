<script setup lang="ts">
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import BaseButton from '@/shared/ui/BaseButton.vue'
import TenantBrand from '@/shared/ui/TenantBrand.vue'
import { PLATFORM_NAME } from '@/shared/constants/platform'
import type { Tenant } from '@/features/tenant/types/tenant'

/**
 * Moldura das telas de conta: cabeçalho, as duas colunas e o rodapé.
 *
 * Entrar e criar conta são a mesma página com os papéis trocados — o que muda
 * é para onde o cabeçalho manda quem chegou na tela errada.
 */
defineProps<{
  tenant: Tenant
  /** Pergunta do cabeçalho, ex.: "Já tem conta?". */
  altPrompt: string
  altLabel: string
  altTo: RouteLocationRaw
}>()
</script>

<template>
  <div class="mx-auto flex min-h-dvh w-full max-w-7xl flex-col">
    <header
      class="flex items-center justify-between gap-4 border-b border-line px-5 py-3.5 md:px-14 md:py-[18px]"
    >
      <TenantBrand :tenant="tenant" />

      <div class="flex items-center gap-3.5">
        <span class="hidden text-sm text-ink-muted md:inline">{{ altPrompt }}</span>
        <BaseButton
          :to="altTo"
          variant="secondary"
          size="sm"
        >
          {{ altLabel }}
        </BaseButton>
      </div>
    </header>

    <main
      id="conteudo-principal"
      tabindex="-1"
      class="grid flex-1 items-stretch lg:grid-cols-2"
    >
      <div class="flex flex-col gap-6 px-5 pt-[26px] pb-7 lg:border-r lg:border-line lg:px-14 lg:pt-13 lg:pb-14">
        <slot />
      </div>

      <div
        class="flex flex-col gap-7 border-t border-line bg-surface-muted px-5 py-7 lg:border-t-0 lg:px-14 lg:pt-13 lg:pb-14"
      >
        <slot name="aside" />
      </div>
    </main>

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
