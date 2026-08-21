<script setup lang="ts">
import BaseLogo from '@/shared/ui/BaseLogo.vue'
import type { Tenant } from '@/features/tenant/types/tenant'

/**
 * Identificação da organização no topo do portal: marca, nome e descrição.
 *
 * Em telas estreitas o nome completo quebraria em duas linhas, por isso o
 * design troca pelo nome curto e esconde a descrição.
 */
defineProps<{ tenant: Tenant }>()
</script>

<template>
  <div class="flex items-center gap-2.5 md:gap-3">
    <BaseLogo
      size="sm"
      class="md:size-[26px]"
    />
    <div class="flex flex-col gap-px">
      <span class="font-serif text-sm font-semibold leading-tight text-ink md:text-base">
        <span class="md:hidden">{{ tenant.shortName }}</span>
        <span class="hidden md:inline">{{ tenant.name }}</span>
      </span>
      <span class="hidden text-xs leading-tight text-ink-muted md:inline">
        {{ tenant.tagline }}
      </span>
    </div>
  </div>
</template>
