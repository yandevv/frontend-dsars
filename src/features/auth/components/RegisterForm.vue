<script setup lang="ts">
import { computed, nextTick, reactive, ref, useTemplateRef } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import BaseAlert from '@/shared/ui/BaseAlert.vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import BaseCheckbox from '@/shared/ui/BaseCheckbox.vue'
import BaseField from '@/shared/ui/BaseField.vue'
import PasswordStrengthMeter from '@/features/auth/components/PasswordStrengthMeter.vue'
import { usePasswordPolicy } from '@/features/auth/composables/usePasswordPolicy'
import { createAccount } from '@/features/auth/services/accountService'
import { messageOf } from '@/shared/api/ApiError'

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

const router = useRouter()

const status = ref<'idle' | 'sending'>('idle')
/** Só depois da primeira tentativa os campos passam a mostrar erro. */
const attempted = ref(false)
const failure = ref('')

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
  failure.value = ''

  if (!isComplete.value) {
    await nextTick()
    summary.value?.focus()
    return
  }

  status.value = 'sending'
  try {
    const email = await createAccount({
      name: form.name,
      email: form.email,
      password: form.password,
    })
    // A conta nasce pendente: a tela de confirmação diz para onde o link foi e
    // cuida do reenvio, com o intervalo mínimo à vista. O servidor responde do
    // mesmo jeito para endereço novo e já cadastrado (RN004) — quem já tem
    // conta recebe no e-mail o aviso, e não um segundo cadastro.
    await router.push({
      name: 'email-confirmation',
      query: { origem: 'cadastro', email },
    })
  } catch (error) {
    status.value = 'idle'
    failure.value = messageOf(error)
  }
}
</script>

<template>
  <form
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

    <BaseAlert
      v-if="failure"
      title="Não conseguimos criar a conta agora"
    >
      <p>{{ failure }}</p>
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
