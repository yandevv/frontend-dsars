<script setup lang="ts">
import BaseLogo from '@/shared/ui/BaseLogo.vue'
import type { Tenant } from '@/features/tenant/types/tenant'

/**
 * Identificação da organização no topo do portal: marca, nome e descrição.
 *
 * Em telas estreitas o nome completo quebraria em duas linhas, por isso o
 * design troca pelo nome curto e esconde a descrição.
 */
const { tenant, tagline, tone = 'light-surface' } = defineProps<{
  tenant: Tenant
  /**
   * Substitui a descrição do tenant quando o cabeçalho tem assunto próprio —
   * o convite anuncia o papel que está sendo oferecido, não o portal.
   */
  tagline?: string
  /** `dark-surface`: cabeçalho preto da tela de convite. */
  tone?: 'light-surface' | 'dark-surface'
}>()
</script>

<template>
  <div class="flex items-center gap-2.5 md:gap-3">
    <BaseLogo
      size="sm"
      class="md:size-[26px]"
      :tone="tone === 'dark-surface' ? 'light' : 'brand'"
    />
    <div class="flex flex-col gap-px">
      <span
        class="font-serif text-sm font-semibold leading-tight md:text-base"
        :class="tone === 'dark-surface' ? 'text-white' : 'text-ink'"
      >
        <span class="md:hidden">{{ tenant.shortName }}</span>
        <span class="hidden md:inline">{{ tenant.name }}</span>
      </span>
      <span
        class="hidden text-xs leading-tight md:inline"
        :class="tone === 'dark-surface' ? 'text-ink-on-dark' : 'text-ink-muted'"
      >
        {{ tagline ?? tenant.tagline }}
      </span>
    </div>
  </div>
</template>
