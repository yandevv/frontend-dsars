<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import AuthLayout from '@/features/auth/components/AuthLayout.vue'
import LoginAside from '@/features/auth/components/LoginAside.vue'
import LoginForm from '@/features/auth/components/LoginForm.vue'
import { useTenant } from '@/features/tenant/composables/useTenant'

const { tenant } = useTenant()
const route = useRoute()

/**
 * O acesso é alcançado de fora: pela recusa de e-mail já cadastrado, que traz o
 * endereço, e pela sessão encerrada por inatividade (RN010), que se anuncia por
 * `?sessao=expirada`. Ler isso aqui mantém o formulário alheio ao roteador.
 */
const initialEmail = computed(() => {
  const value = route.query.email
  return typeof value === 'string' ? value : ''
})

const sessionExpired = computed(() => route.query.sessao === 'expirada')
</script>

<template>
  <AuthLayout
    :tenant="tenant"
    alt-prompt="Ainda não tem conta?"
    alt-label="Criar conta"
    :alt-to="{ name: 'register' }"
  >
    <LoginForm
      :initial-email="initialEmail"
      :session-expired="sessionExpired"
    />

    <template #aside>
      <LoginAside :dpo="tenant.dpo" />
    </template>
  </AuthLayout>
</template>
