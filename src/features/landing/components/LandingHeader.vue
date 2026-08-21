<script setup lang="ts">
import BaseButton from '@/shared/ui/BaseButton.vue'
import TenantBrand from '@/shared/ui/TenantBrand.vue'
import type { Tenant } from '@/features/tenant/types/tenant'

defineProps<{ tenant: Tenant }>()
</script>

<template>
  <header
    class="flex items-center justify-between gap-4 border-b border-line px-5 py-3.5 md:px-14 md:py-[18px]"
  >
    <TenantBrand :tenant="tenant" />

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
