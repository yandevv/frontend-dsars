<script setup lang="ts">
import type { DataProtectionOfficer } from '@/features/tenant/types/tenant'

/**
 * Saída de emergência das telas de conta: a quem recorrer quando o formulário
 * não resolve. O contato é o mesmo da página inicial, vindo do tenant.
 */
const { eyebrow, dpo } = defineProps<{
  eyebrow: string
  dpo: DataProtectionOfficer
}>()
</script>

<template>
  <div class="flex flex-col gap-2 border-t border-line pt-6">
    <p class="font-label text-xs font-semibold uppercase tracking-[0.06em] text-ink-soft">
      {{ eyebrow }}
    </p>
    <a
      :href="`mailto:${dpo.email}`"
      class="text-[15px] font-medium break-words text-brand hover:text-brand-strong"
    >{{ dpo.email }}</a>
    <p class="text-sm leading-normal text-ink-soft">
      {{ dpo.name }}, {{ dpo.role.toLocaleLowerCase('pt-BR') }} · {{ dpo.phone }}
    </p>
    <slot />
  </div>
</template>
