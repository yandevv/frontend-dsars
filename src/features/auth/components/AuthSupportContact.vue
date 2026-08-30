<script setup lang="ts">
import type { DataProtectionOfficer } from '@/features/tenant/types/tenant'

/**
 * Saída de emergência das telas de conta: a quem recorrer quando o formulário
 * não resolve. O contato é o mesmo da página inicial, vindo do tenant.
 */
const { eyebrow, dpo, divided = true } = defineProps<{
  eyebrow: string
  dpo: DataProtectionOfficer
  /**
   * Filete que separa este bloco do que vem acima. Falso quando ele abre a
   * coluna: um filete sem nada acima não separa nada, só suja a tela.
   */
  divided?: boolean
}>()
</script>

<template>
  <div
    class="flex flex-col gap-2"
    :class="divided ? 'border-t border-line pt-6' : ''"
  >
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
