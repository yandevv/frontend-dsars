<script setup lang="ts">
import InviteBond from '@/features/auth/components/InviteBond.vue'
import type { InvitePreview } from '@/features/auth/types/invite'
import type { Tenant } from '@/features/tenant/types/tenant'

/** Coluna de apoio do convite: o vínculo e o que o perfil permite. */
const { invite, tenant, accepted = false } = defineProps<{
  invite: InvitePreview
  tenant: Tenant
  /** Vínculo já aceito: não há mais o que ignorar. */
  accepted?: boolean
}>()
</script>

<template>
  <InviteBond
    :invite="invite"
    :tenant="tenant"
  />

  <section
    aria-labelledby="convite-perfil"
    class="flex flex-col gap-3"
  >
    <h2
      id="convite-perfil"
      class="font-serif text-[22px] font-semibold text-ink"
    >
      O que o perfil de encarregado permite
    </h2>
    <p class="text-[15px] leading-relaxed text-ink-body">
      Ver e responder as requisições dirigidas a esta organização, pedir informações
      complementares ao titular, encerrar atendimentos e consultar a trilha de auditoria.
    </p>
    <p class="text-[15px] leading-relaxed text-ink-body">
      O perfil não é escolhido no cadastro: ele vem deste convite e está vinculado a esta
      organização. Se você também for titular de dados em outra organização, use uma conta
      própria para isso.
    </p>
  </section>

  <p
    v-if="!accepted"
    class="border-t border-line pt-[22px] text-[15px] leading-relaxed text-ink-body"
  >
    Não reconhece este convite? Basta não aceitá-lo: ele vence sozinho e nenhum vínculo é
    criado.
  </p>
</template>
