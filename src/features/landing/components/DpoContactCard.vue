<script setup lang="ts">
import { computed } from 'vue'
import type { DataProtectionOfficer } from '@/features/tenant/types/tenant'

const { dpo } = defineProps<{
  dpo: DataProtectionOfficer
  /** Endereço da organização, não da pessoa encarregada. */
  address: string
}>()

/**
 * O telefone é guardado já formatado para leitura; aqui montamos a versão
 * discável. Assume número brasileiro, o que é coerente com uma plataforma
 * dedicada à LGPD.
 */
const phoneHref = computed(() => `tel:+55${dpo.phone.replace(/\D/g, '')}`)
</script>

<template>
  <!--
    Em telas estreitas ocupa a largura toda, como uma faixa (o -mx-5 desfaz o
    respiro lateral da seção). A partir de lg vira o cartão lateral do design.
  -->
  <div
    class="-mx-5 flex flex-col gap-4 border-t border-line-wash bg-brand-wash/60 px-5 py-6 lg:mx-0 lg:self-start lg:rounded-md lg:border-0 lg:px-6 lg:py-[26px]"
  >
    <p class="font-label text-[11px] uppercase tracking-[0.08em] text-brand">
      {{ dpo.role }}
    </p>

    <div class="flex flex-col gap-1">
      <p class="font-serif text-[19px] font-semibold text-ink lg:text-[21px]">
        {{ dpo.name }}
      </p>
      <p class="text-sm leading-normal text-ink-soft">
        {{ dpo.blurb }}
      </p>
    </div>

    <dl class="flex flex-col gap-2.5 border-t border-line-wash pt-4">
      <div class="flex flex-col gap-0.5">
        <dt class="text-xs text-ink-muted">
          E-mail
        </dt>
        <dd>
          <a
            :href="`mailto:${dpo.email}`"
            class="text-[15px] font-medium break-words text-brand hover:text-brand-strong"
          >{{ dpo.email }}</a>
        </dd>
      </div>
      <div class="flex flex-col gap-0.5">
        <dt class="text-xs text-ink-muted">
          Telefone
        </dt>
        <dd class="text-[15px] text-ink-body">
          <a
            :href="phoneHref"
            class="font-medium text-brand hover:text-brand-strong"
          >{{ dpo.phone }}</a>
          · {{ dpo.officeHours }}
        </dd>
      </div>
      <div class="flex flex-col gap-0.5">
        <dt class="text-xs text-ink-muted">
          Endereço
        </dt>
        <dd class="text-[15px] leading-[1.45] text-ink-body">
          {{ address }}
        </dd>
      </div>
    </dl>
  </div>
</template>
