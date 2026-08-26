<script setup lang="ts">
import AppFooter from '@/shared/layout/AppFooter.vue'
import AppHeader from '@/shared/layout/AppHeader.vue'
import { APP_AREAS } from '@/shared/layout/areas'
import { useSession } from '@/features/auth/composables/useSession'
import { useTenant } from '@/features/tenant/composables/useTenant'
import type { Account, AccountRole } from '@/features/auth/types/auth'

/**
 * Moldura das telas de dentro do sistema: cabeçalho, conteúdo e rodapé.
 *
 * Recebe o perfil que a tela atende e monta o resto a partir dele — é o que
 * mantém o portal do titular e a área do encarregado sendo a mesma moldura em
 * vez de duas que precisam ser conservadas em paralelo.
 */
const { role } = defineProps<{ role: AccountRole }>()

const { tenant } = useTenant()
const { account } = useSession(role)

defineSlots<{ default(props: { account: Account }): unknown }>()
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-surface">
    <AppHeader
      :tenant="tenant"
      :area="APP_AREAS[role]"
      :account="account"
    />

    <main
      id="conteudo-principal"
      tabindex="-1"
      class="flex-1 px-5 py-6 lg:px-10 lg:py-8"
    >
      <slot :account="account" />
    </main>

    <AppFooter :tenant="tenant" />
  </div>
</template>
