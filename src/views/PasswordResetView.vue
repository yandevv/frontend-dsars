<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

import AuthCard from '@/features/auth/components/AuthCard.vue'
import BaseAlert from '@/shared/ui/BaseAlert.vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import BaseField from '@/shared/ui/BaseField.vue'
import PasswordStrengthMeter from '@/features/auth/components/PasswordStrengthMeter.vue'
import { usePasswordPolicy } from '@/features/auth/composables/usePasswordPolicy'
import { resetPassword } from '@/features/auth/services/passwordResetService'
import { messageOf } from '@/shared/api/ApiError'

/**
 * Redefinir a senha pelo link recebido por e-mail (RN002/RN003).
 *
 * O critério de senha é conferido enquanto a pessoa digita, com o mesmo
 * medidor do cadastro; quem decide de verdade é o servidor.
 */
const route = useRoute()
const token = computed(() => (typeof route.query.token === 'string' ? route.query.token : ''))

const password = ref('')
const confirmation = ref('')
const attempted = ref(false)
const status = ref<'idle' | 'sending' | 'done'>('idle')
const error = ref('')

const { checks, isValid, strength } = usePasswordPolicy(() => password.value)

const confirmationError = computed(() =>
  confirmation.value.length > 0 && confirmation.value !== password.value
    ? 'As duas senhas precisam ser iguais.'
    : undefined,
)

async function submit() {
  attempted.value = true
  error.value = ''
  if (!isValid.value || confirmation.value !== password.value) return

  status.value = 'sending'
  try {
    await resetPassword(token.value, password.value)
    status.value = 'done'
  } catch (failure) {
    status.value = 'idle'
    error.value = messageOf(failure)
  }
}
</script>

<template>
  <AuthCard>
    <div class="flex flex-col gap-3">
      <p class="font-label text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft">
        Recuperar o acesso
      </p>
      <h1 class="font-serif text-[26px] font-semibold leading-tight text-ink md:text-[34px]">
        Escolha uma senha nova
      </h1>
    </div>

    <template v-if="!token">
      <BaseAlert title="Este link está incompleto">
        <p>Abra o link direto do e-mail ou peça outro.</p>
      </BaseAlert>
      <BaseButton :to="{ name: 'password-recovery' }">
        Pedir novo link
      </BaseButton>
    </template>

    <template v-else-if="status === 'done'">
      <div
        role="status"
        class="flex flex-col gap-2 border-l-[3px] border-brand bg-brand-wash px-5 py-[22px]"
      >
        <p class="font-serif text-xl font-semibold text-ink">
          Senha redefinida
        </p>
        <p class="text-[15px] leading-relaxed text-ink-body">
          As outras sessões da conta foram encerradas. Entre com a senha nova.
        </p>
      </div>
      <BaseButton :to="{ name: 'login' }">
        Entrar no portal
      </BaseButton>
    </template>

    <form
      v-else
      class="flex flex-col gap-[18px]"
      novalidate
      @submit.prevent="submit"
    >
      <BaseAlert
        v-if="error"
        title="Não foi possível redefinir a senha"
      >
        <p>{{ error }}</p>
        <p>
          <RouterLink
            :to="{ name: 'password-recovery' }"
            class="font-medium underline"
          >
            Pedir novo link
          </RouterLink>
        </p>
      </BaseAlert>
      <BaseField
        v-model="password"
        label="Nova senha"
        type="password"
        autocomplete="new-password"
        :disabled="status === 'sending'"
      />
      <PasswordStrengthMeter
        :checks="checks"
        :strength="strength"
        :invalid="attempted && !isValid"
      />
      <BaseField
        v-model="confirmation"
        label="Confirmação da nova senha"
        type="password"
        autocomplete="new-password"
        :error="confirmationError"
        :disabled="status === 'sending'"
      />
      <BaseButton
        type="submit"
        block
        :busy="status === 'sending'"
      >
        {{ status === 'sending' ? 'Salvando…' : 'Salvar senha nova' }}
      </BaseButton>
    </form>
  </AuthCard>
</template>
