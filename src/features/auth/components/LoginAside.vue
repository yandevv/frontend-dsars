<script setup lang="ts">
import AuthSupportContact from '@/features/auth/components/AuthSupportContact.vue'
import type { DataProtectionOfficer } from '@/features/tenant/types/tenant'

/** Coluna de apoio do acesso: a quem recorrer quando entrar não dá certo. */
defineProps<{ dpo: DataProtectionOfficer }>()
</script>

<template>
  <AuthSupportContact
    eyebrow="Não consegue entrar"
    :dpo="dpo"
    :divided="false"
  >
    <p class="text-sm leading-normal text-ink-soft">
      Você também pode registrar um pedido sem conta pelo canal de atendimento
      presencial da unidade.
    </p>
  </AuthSupportContact>
</template>
