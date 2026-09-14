<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AuthCard from '@/features/auth/components/AuthCard.vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import { reloadSession } from '@/features/auth/composables/useSession'
import { ROLE_HOME } from '@/features/auth/constants/roleHome'

/**
 * Volta do Google.
 *
 * No sucesso, a API já abriu a sessão pelos cookies: basta ler o perfil e
 * seguir ao ambiente dele. Na recusa, o motivo vem na query.
 */
const route = useRoute()
const router = useRouter()

const REASONS: Record<string, { title: string; text: string }> = {
  'email-nao-verificado': {
    title: 'O Google não confirmou este e-mail',
    text: 'Confirme o endereço na sua conta Google ou entre com e-mail e senha.',
  },
  'conta-desativada': {
    title: 'Esta conta está desativada',
    text: 'Fale com a pessoa encarregada de proteção de dados para entender o motivo.',
  },
  'conta-existente': {
    title: 'Já existe uma conta com este e-mail',
    text: 'Entre com e-mail e senha. Se não lembra a senha, recupere o acesso.',
  },
  'estado-invalido': {
    title: 'O acesso pelo Google expirou',
    text: 'A volta do Google demorou ou foi aberta em outra aba. Tente de novo.',
  },
}

const failure = computed(() => {
  if (route.name !== 'google-error') return null
  const reason = typeof route.query.motivo === 'string' ? route.query.motivo : ''
  return (
    REASONS[reason] ?? {
      title: 'Não foi possível entrar com o Google',
      text: 'Tente de novo em alguns instantes ou entre com e-mail e senha.',
    }
  )
})

onMounted(async () => {
  if (failure.value) return
  const account = await reloadSession()
  await router.replace(account ? ROLE_HOME[account.role] : { name: 'login' })
})
</script>

<template>
  <AuthCard>
    <template v-if="failure">
      <div class="flex flex-col gap-3 border-l-[3px] border-danger bg-danger-wash px-5 py-[22px]">
        <h1 class="font-serif text-[26px] font-semibold leading-tight text-ink">
          {{ failure.title }}
        </h1>
        <p class="text-[15px] leading-relaxed text-ink-body">
          {{ failure.text }}
        </p>
      </div>
      <div class="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
        <BaseButton :to="{ name: 'login' }">
          Ir para o login
        </BaseButton>
        <BaseButton
          variant="secondary"
          :to="{ name: 'password-recovery' }"
        >
          Recuperar o acesso
        </BaseButton>
      </div>
    </template>

    <div
      v-else
      role="status"
      class="flex flex-col gap-3.5"
    >
      <span
        aria-hidden="true"
        class="inline-block size-[26px] animate-spin rounded-full border-[3px] border-brand border-r-track"
      />
      <h1 class="font-serif text-2xl font-semibold leading-tight text-ink">
        Abrindo sua conta…
      </h1>
    </div>
  </AuthCard>
</template>
