<script setup lang="ts">
import AuthLayout from '@/features/auth/components/AuthLayout.vue'
import RegisterAside from '@/features/auth/components/RegisterAside.vue'
import RegisterForm from '@/features/auth/components/RegisterForm.vue'
import { useTenant } from '@/features/tenant/composables/useTenant'

const { tenant } = useTenant()
</script>

<template>
  <AuthLayout
    :tenant="tenant"
    alt-prompt="Já tem conta?"
    alt-label="Entrar"
    :alt-to="{ name: 'login' }"
  >
    <RegisterForm />

    <template #aside>
      <RegisterAside :dpo="tenant.dpo" />
    </template>
  </AuthLayout>
</template>
