<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'

import AuthCard from '@/features/auth/components/AuthCard.vue'
import BaseAlert from '@/shared/ui/BaseAlert.vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import BaseField from '@/shared/ui/BaseField.vue'
import { requestPasswordReset } from '@/features/auth/services/passwordResetService'
import { messageOf } from '@/shared/api/ApiError'

/**
 * Recuperar o acesso: pede o link de redefinição de senha.
 *
 * A confirmação é a mesma exista ou não conta para o endereço — o portal não
 * diz a um estranho quem tem cadastro.
 */
const route = useRoute()

const email = ref(typeof route.query.email === 'string' ? route.query.email : '')
const status = ref<'idle' | 'sending' | 'sent'>('idle')
const error = ref('')

async function submit() {
  error.value = ''
  if (!/.+@.+\..+/.test(email.value.trim())) {
    error.value = 'Informe o e-mail da conta, no formato nome@dominio.com.br.'
    return
  }

  status.value = 'sending'
  try {
    await requestPasswordReset(email.value)
    status.value = 'sent'
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
        Redefina sua senha pelo e-mail
      </h1>
      <p class="text-base leading-relaxed text-ink-body">
        Enviamos um link para o endereço da conta. Ao abrir, você escolhe uma senha nova e as
        outras sessões abertas são encerradas.
      </p>
    </div>

    <div
      v-if="status === 'sent'"
      role="status"
      class="flex flex-col gap-2 border-l-[3px] border-brand bg-brand-wash px-5 py-[22px]"
    >
      <p class="font-serif text-xl font-semibold text-ink">
        Confira sua caixa de entrada
      </p>
      <p class="text-[15px] leading-relaxed text-ink-body">
        Se houver uma conta com <strong class="break-all">{{ email.trim() }}</strong>, o link
        chega em instantes. Ele vale por 30 minutos — confira também o spam.
      </p>
    </div>

    <form
      v-else
      class="flex flex-col gap-[18px]"
      novalidate
      @submit.prevent="submit"
    >
      <BaseAlert
        v-if="error"
        title="Não foi possível enviar o link"
      >
        <p>{{ error }}</p>
      </BaseAlert>
      <BaseField
        v-model="email"
        label="E-mail da conta"
        type="email"
        placeholder="nome@exemplo.com.br"
        autocomplete="email"
        :disabled="status === 'sending'"
      />
      <BaseButton
        type="submit"
        block
        :busy="status === 'sending'"
      >
        {{ status === 'sending' ? 'Enviando…' : 'Enviar link de redefinição' }}
      </BaseButton>
    </form>
  </AuthCard>
</template>
