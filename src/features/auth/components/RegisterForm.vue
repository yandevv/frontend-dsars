<script setup lang="ts">
import { computed, nextTick, reactive, ref, useTemplateRef } from 'vue'
import { RouterLink } from 'vue-router'

import BaseAlert from '@/shared/ui/BaseAlert.vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import BaseCheckbox from '@/shared/ui/BaseCheckbox.vue'
import BaseField from '@/shared/ui/BaseField.vue'
import PasswordStrengthMeter from '@/features/auth/components/PasswordStrengthMeter.vue'
import { usePasswordPolicy } from '@/features/auth/composables/usePasswordPolicy'
import {
  AccountError,
  createAccount,
  resendConfirmation,
} from '@/features/auth/services/accountService'

/**
 * Cadastro do titular (RF002, RN002 a RN005).
 *
 * Duas decisões de acessibilidade que o mockup não expressa: o botão continua
 * habilitado mesmo com o formulário incompleto — um botão desabilitado não
 * explica o que falta e não recebe foco — e, quando o envio é recusado, o
 * resumo dos problemas recebe o foco, para que quem usa leitor de tela saiba
 * o que aconteceu sem varrer a página atrás da mensagem.
 */
const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmation: '',
  acceptedTerms: false,
})

/** `created` troca o formulário pela confirmação do RN005. */
const status = ref<'idle' | 'sending' | 'created'>('idle')
/** Só depois da primeira tentativa os campos passam a mostrar erro. */
const attempted = ref(false)
const takenEmail = ref('')
const unexpectedFailure = ref(false)
const createdEmail = ref('')
const resendStatus = ref<'idle' | 'sending' | 'sent'>('idle')

const summary = useTemplateRef<HTMLElement>('summary')

const { checks, isValid: passwordIsValid, strength } = usePasswordPolicy(() => form.password)

/**
 * Conferência deliberadamente frouxa: só o servidor sabe se um endereço
 * existe, e uma expressão estrita rejeitaria endereços válidos e raros.
 */
const emailIsValid = computed(() => /.+@.+\..+/.test(form.email.trim()))

const confirmationMatches = computed(
  () => form.confirmation.length > 0 && form.confirmation === form.password,
)

const isComplete = computed(
  () =>
    form.name.trim() !== '' &&
    emailIsValid.value &&
    passwordIsValid.value &&
    confirmationMatches.value &&
    form.acceptedTerms,
)

const nameError = computed(() =>
  attempted.value && form.name.trim() === ''
    ? 'Informe o nome completo, como consta no seu documento.'
    : undefined,
)

const emailError = computed(() =>
  attempted.value && !emailIsValid.value
    ? 'Este endereço está incompleto. Um e-mail tem o formato nome@dominio.com.br.'
    : undefined,
)

const confirmationError = computed(() =>
  form.confirmation.length > 0 && !confirmationMatches.value
    ? 'As duas senhas precisam ser iguais.'
    : undefined,
)

const confirmationHint = computed(() =>
  confirmationMatches.value
    ? 'As senhas coincidem.'
    : 'Repita a senha exatamente como digitou acima.',
)

const termsError = computed(() =>
  attempted.value && !form.acceptedTerms ? 'O aceite é obrigatório para criar a conta.' : undefined,
)

const showSummary = computed(() => attempted.value && !isComplete.value)

const submitLabel = computed(() => (status.value === 'sending' ? 'Criando conta…' : 'Criar conta'))

const submitHint = computed(() =>
  isComplete.value
    ? `Tudo certo. Enviaremos o link de confirmação para ${form.email.trim()}.`
    : 'Enviaremos um link de confirmação para o e-mail informado. A conta fica pendente até ele ser aberto.',
)

async function submit() {
  attempted.value = true
  takenEmail.value = ''
  unexpectedFailure.value = false

  if (!isComplete.value) {
    await nextTick()
    summary.value?.focus()
    return
  }

  status.value = 'sending'
  try {
    const account = await createAccount({
      name: form.name,
      email: form.email,
      password: form.password,
    })
    createdEmail.value = account.email
    status.value = 'created'
  } catch (error) {
    status.value = 'idle'
    if (error instanceof AccountError && error.reason === 'email-em-uso') {
      takenEmail.value = form.email.trim()
    } else {
      unexpectedFailure.value = true
    }
  }
}

async function resend() {
  if (resendStatus.value === 'sending') return

  resendStatus.value = 'sending'
  try {
    await resendConfirmation(createdEmail.value)
    resendStatus.value = 'sent'
  } catch {
    resendStatus.value = 'idle'
  }
}
</script>

<template>
  <!-- RN005: conta criada, à espera da confirmação do e-mail. -->
  <div
    v-if="status === 'created'"
    class="flex flex-col gap-[18px]"
  >
    <BaseAlert
      variant="success"
      size="md"
      title="Conta criada. Falta confirmar o e-mail."
    >
      <p>Enviamos um link de confirmação para:</p>
      <p class="text-[17px] font-semibold break-all text-brand">
        {{ createdEmail }}
      </p>
      <p>
        Abra esse link para ativar a conta. Até lá você pode entrar, mas ainda não
        registrar pedidos.
      </p>
    </BaseAlert>

    <div class="flex flex-col gap-2.5">
      <BaseButton
        block
        :busy="resendStatus === 'sending'"
        @click="resend"
      >
        {{ resendStatus === 'sending' ? 'Reenviando…' : 'Reenviar o link' }}
      </BaseButton>
      <p
        v-if="resendStatus === 'sent'"
        role="status"
        class="text-[13px] leading-normal text-brand"
      >
        Enviamos outro link para {{ createdEmail }}.
      </p>
      <p class="text-[13px] leading-normal text-ink-muted">
        O link vale por 24 horas. Se não chegar, confira a caixa de spam antes de pedir outro.
      </p>
    </div>
  </div>

  <form
    v-else
    class="flex flex-col gap-[26px]"
    novalidate
    @submit.prevent="submit"
  >
    <div class="flex flex-col gap-2.5">
      <h1 class="font-serif text-3xl font-semibold leading-tight text-ink lg:text-4xl">
        Criar conta
      </h1>
      <p class="max-w-[46ch] text-base leading-relaxed text-ink-body">
        A conta é o que garante que os dados de um pedido sejam entregues à pessoa certa.
        Pedimos apenas o necessário para isso.
      </p>
    </div>

    <div
      v-if="showSummary"
      ref="summary"
      tabindex="-1"
    >
      <BaseAlert title="Ainda não é possível criar a conta">
        <p>Revise os campos marcados abaixo para concluir.</p>
      </BaseAlert>
    </div>

    <!-- RN004: um endereço de e-mail, uma única conta. -->
    <BaseAlert
      v-if="takenEmail"
      variant="success"
      size="md"
      title="Já existe uma conta com este e-mail"
    >
      <p>
        Cada endereço de e-mail tem uma única conta. Se a conta é sua, entre com ela.
        Se não lembra a senha, podemos enviar um link para você criar outra.
      </p>
      <div class="flex flex-wrap gap-2.5 pt-0.5">
        <BaseButton
          :to="{ name: 'login', query: { email: takenEmail } }"
          size="sm"
        >
          Entrar com este e-mail
        </BaseButton>
        <BaseButton
          :to="{ name: 'password-recovery', query: { email: takenEmail } }"
          variant="secondary"
          size="sm"
        >
          Esqueci a senha
        </BaseButton>
      </div>
    </BaseAlert>

    <BaseAlert
      v-if="unexpectedFailure"
      title="Não conseguimos criar a conta agora"
    >
      <p>Houve uma falha ao falar com o servidor. Tente novamente em alguns instantes.</p>
    </BaseAlert>

    <div class="flex flex-col gap-[18px]">
      <BaseField
        v-model="form.name"
        label="Nome completo"
        placeholder="Como consta no seu documento"
        autocomplete="name"
        :error="nameError"
        :disabled="status === 'sending'"
      />

      <BaseField
        v-model="form.email"
        label="E-mail"
        type="email"
        placeholder="nome@exemplo.com.br"
        autocomplete="email"
        hint="É para este endereço que enviaremos o link de confirmação e os avisos sobre os seus pedidos."
        :error="emailError"
        :disabled="status === 'sending'"
      />

      <BaseField
        v-model="form.password"
        label="Senha"
        type="password"
        placeholder="Mínimo de 12 caracteres"
        autocomplete="new-password"
        :disabled="status === 'sending'"
      />

      <PasswordStrengthMeter
        :checks="checks"
        :strength="strength"
        :invalid="attempted && !passwordIsValid"
      />

      <BaseField
        v-model="form.confirmation"
        label="Confirmação de senha"
        type="password"
        placeholder="Repita a senha"
        autocomplete="new-password"
        :hint="confirmationHint"
        :hint-tone="confirmationMatches ? 'positive' : 'muted'"
        :error="confirmationError"
        :disabled="status === 'sending'"
      />

      <BaseCheckbox
        v-model="form.acceptedTerms"
        :error="termsError"
        :disabled="status === 'sending'"
      >
        <span class="text-[15px] leading-normal text-ink-body">
          Li e aceito os
          <RouterLink
            :to="{ name: 'terms' }"
            class="text-brand hover:text-brand-strong"
          >termos de uso</RouterLink>
          e o
          <RouterLink
            :to="{ name: 'privacy' }"
            class="text-brand hover:text-brand-strong"
          >aviso de privacidade</RouterLink>.
        </span>
      </BaseCheckbox>

      <div class="flex flex-col gap-3 pt-0.5">
        <BaseButton
          type="submit"
          block
          :busy="status === 'sending'"
        >
          {{ submitLabel }}
        </BaseButton>
        <p class="text-[13px] leading-normal text-ink-muted">
          {{ submitHint }}
        </p>
      </div>
    </div>
  </form>
</template>
