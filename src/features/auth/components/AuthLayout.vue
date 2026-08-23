<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

import AuthChrome from '@/features/auth/components/AuthChrome.vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import type { Tenant } from '@/features/tenant/types/tenant'

/**
 * Moldura das telas de conta em duas colunas: formulário à esquerda, apoio à
 * direita.
 *
 * Entrar e criar conta são a mesma página com os papéis trocados — o que muda
 * é para onde o cabeçalho manda quem chegou na tela errada. O convite não tem
 * para onde mandar ninguém: quem chega nele veio de um link nominal, então a
 * ação alternativa é opcional e dá lugar à validade do convite.
 */
const {
  tenant,
  tagline,
  tone = 'light-surface',
  altPrompt,
  altLabel,
  altTo,
} = defineProps<{
  tenant: Tenant
  tagline?: string
  tone?: 'light-surface' | 'dark-surface'
  /** Pergunta do cabeçalho, ex.: "Já tem conta?". */
  altPrompt?: string
  altLabel?: string
  altTo?: RouteLocationRaw
}>()
</script>

<template>
  <AuthChrome
    :tenant="tenant"
    :tagline="tagline"
    :tone="tone"
  >
    <template #action>
      <template v-if="altTo !== undefined && altLabel !== undefined">
        <span
          v-if="altPrompt"
          class="hidden text-sm text-ink-muted md:inline"
        >{{ altPrompt }}</span>
        <BaseButton
          :to="altTo"
          variant="secondary"
          size="sm"
        >
          {{ altLabel }}
        </BaseButton>
      </template>
      <slot name="header-action" />
    </template>

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
  </AuthChrome>
</template>
