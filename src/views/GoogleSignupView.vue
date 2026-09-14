<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import AuthCard from '@/features/auth/components/AuthCard.vue'
import BaseAlert from '@/shared/ui/BaseAlert.vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import BaseCheckbox from '@/shared/ui/BaseCheckbox.vue'
import { startSession } from '@/features/auth/composables/useSession'
import { ROLE_HOME } from '@/features/auth/constants/roleHome'
import { completeGoogleSignup } from '@/features/auth/services/sessionService'
import { messageOf } from '@/shared/api/ApiError'

/**
 * Primeira entrada pelo Google: falta só o aceite dos termos de uso e do aviso
 * de privacidade, que o Google não coleta. O nome e o e-mail vieram de lá.
 */
const router = useRouter()

const accepted = ref(false)
const attempted = ref(false)
const sending = ref(false)
const error = ref('')

async function submit() {
  attempted.value = true
  error.value = ''
  if (!accepted.value) return

  sending.value = true
  try {
    const account = await completeGoogleSignup()
    startSession(account)
    await router.replace(ROLE_HOME[account.role])
  } catch (failure) {
    error.value = messageOf(failure)
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <AuthCard>
    <div class="flex flex-col gap-3">
      <p class="font-label text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft">
        Cadastro pelo Google
      </p>
      <h1 class="font-serif text-[26px] font-semibold leading-tight text-ink md:text-[34px]">
        Falta um passo para criar a conta
      </h1>
      <p class="text-base leading-relaxed text-ink-body">
        O Google confirmou seu nome e seu e-mail. Para usar o portal, leia e aceite os termos de
        uso e o aviso de privacidade.
      </p>
    </div>

    <form
      class="flex flex-col gap-[18px]"
      novalidate
      @submit.prevent="submit"
    >
      <BaseAlert
        v-if="error"
        title="Não foi possível concluir o cadastro"
      >
        <p>{{ error }}</p>
        <p>
          <RouterLink
            :to="{ name: 'login' }"
            class="font-medium underline"
          >
            Voltar ao login
          </RouterLink>
        </p>
      </BaseAlert>
      <BaseCheckbox
        v-model="accepted"
        :disabled="sending"
      >
        <span class="text-[15px] text-ink">
          Li e aceito os
          <RouterLink
            :to="{ name: 'terms' }"
            class="text-brand underline"
          >termos de uso</RouterLink>
          e o
          <RouterLink
            :to="{ name: 'privacy' }"
            class="text-brand underline"
          >aviso de privacidade</RouterLink>.
        </span>
        <span
          v-if="attempted && !accepted"
          class="text-[13px] text-danger"
        >O aceite é obrigatório para criar a conta.</span>
      </BaseCheckbox>
      <BaseButton
        type="submit"
        block
        :busy="sending"
      >
        {{ sending ? 'Criando conta…' : 'Criar conta' }}
      </BaseButton>
    </form>
  </AuthCard>
</template>
