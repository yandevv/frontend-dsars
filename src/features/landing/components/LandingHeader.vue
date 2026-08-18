<script setup lang="ts">
import BaseButton from '@/shared/ui/BaseButton.vue'
import BaseLogo from '@/shared/ui/BaseLogo.vue'
import type { Tenant } from '@/features/tenant/types/tenant'

defineProps<{ tenant: Tenant }>()
</script>

<template>
  <header
    class="flex items-center justify-between gap-4 border-b border-line px-5 py-3.5 md:px-14 md:py-[18px]"
  >
    <div class="flex items-center gap-2.5 md:gap-3">
      <BaseLogo
        size="sm"
        class="md:size-[26px]"
      />
      <div class="flex flex-col gap-px">
        <span class="font-serif text-sm font-semibold leading-tight text-ink md:text-base">
          <!-- Em telas estreitas o nome completo quebraria em duas linhas. -->
          <span class="md:hidden">{{ tenant.shortName }}</span>
          <span class="hidden md:inline">{{ tenant.name }}</span>
        </span>
        <span class="hidden text-xs leading-tight text-ink-muted md:inline">
          {{ tenant.tagline }}
        </span>
      </div>
    </div>

    <nav
      aria-label="Acesso à conta"
      class="flex items-center gap-2.5"
    >
      <BaseButton
        :to="{ name: 'login' }"
        variant="secondary"
        size="sm"
      >
        Entrar
      </BaseButton>
      <span class="hidden md:inline-flex">
        <BaseButton
          :to="{ name: 'register' }"
          size="sm"
        >
          Registrar-se
        </BaseButton>
      </span>
    </nav>
  </header>
</template>
