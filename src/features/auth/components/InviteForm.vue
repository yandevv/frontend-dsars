<script setup lang="ts">
import { computed, nextTick, reactive, ref, useTemplateRef } from 'vue'
import { RouterLink } from 'vue-router'

import BaseAlert from '@/shared/ui/BaseAlert.vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import BaseCheckbox from '@/shared/ui/BaseCheckbox.vue'
import BaseField from '@/shared/ui/BaseField.vue'
import PasswordStrengthMeter from '@/features/auth/components/PasswordStrengthMeter.vue'
import { usePasswordPolicy } from '@/features/auth/composables/usePasswordPolicy'
import { InviteError, acceptInvite } from '@/features/auth/services/inviteService'
import type { Invite } from '@/features/auth/types/invite'

/**
 * Cadastro por convite (RF002, variante do quadro 1c).
 *
 * É o formulário do cadastro comum com duas diferenças que vêm do convite: o
 * e-mail chega travado, porque trocá-lo desfaria o vínculo que o convite
 * estabelece, e não há escolha de perfil — ele já foi atribuído por quem
 * convidou.
 */
const { invite } = defineProps<{ invite: Invite }>()

/** A coluna de apoio precisa saber: recusar um convite já aceito não faz sentido. */
const emit = defineEmits<{ accepted: [] }>()

const form = reactive({
  name: '',
  password: '',
  confirmation: '',
  acceptedTerms: false,
})

/** O endereço do convite é exibido num campo travado, nunca editado. */
const invitedEmail = ref(invite.email)

const status = ref<'idle' | 'sending' | 'accepted'>('idle')
const attempted = ref(false)
const failure = ref<'utilizado' | 'inesperada' | null>(null)

const summary = useTemplateRef<HTMLElement>('summary')

const { checks, isValid: passwordIsValid, strength } = usePasswordPolicy(() => form.password)

const confirmationMatches = computed(
  () => form.confirmation.length > 0 && form.confirmation === form.password,
)

const isComplete = computed(
  () =>
    form.name.trim() !== '' &&
    passwordIsValid.value &&
    confirmationMatches.value &&
    form.acceptedTerms,
)

const nameError = computed(() =>
  attempted.value && form.name.trim() === ''
    ? 'Informe o nome completo, como consta no seu documento.'
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

const submitLabel = computed(() =>
  status.value === 'sending' ? 'Criando conta…' : 'Aceitar convite e criar conta',
)

async function submit() {
  attempted.value = true
  failure.value = null

  if (!isComplete.value) {
    await nextTick()
    summary.value?.focus()
    return
  }

  status.value = 'sending'
  try {
    await acceptInvite({ token: invite.token, name: form.name, password: form.password })
    status.value = 'accepted'
    emit('accepted')
  } catch (error) {
    status.value = 'idle'
    failure.value = error instanceof InviteError ? 'utilizado' : 'inesperada'
  }
}
</script>

<template>
  <!-- Conta criada: o convite dispensa o link do RN005 (veja `inviteService`). -->
  <div
    v-if="status === 'accepted'"
    class="flex flex-col gap-[18px]"
  >
    <BaseAlert
      variant="success"
      size="md"
      title="Conta criada e vínculo aceito"
    >
      <p>Você já é encarregado de proteção de dados do portal e pode entrar com:</p>
      <p class="text-[17px] font-semibold break-words text-brand">
        {{ invite.email }}
      </p>
      <p>
        O endereço não precisa de confirmação: o convite foi enviado para ele e aberto por
        você.
      </p>
    </BaseAlert>

    <BaseButton
      block
      :to="{ name: 'login', query: { email: invite.email } }"
    >
      Entrar no painel de atendimento
    </BaseButton>
  </div>

  <form
    v-else
    class="flex flex-col gap-[26px]"
    novalidate
    @submit.prevent="submit"
  >
    <div class="flex flex-col gap-2.5">
      <h1 class="font-serif text-3xl font-semibold leading-tight text-ink lg:text-4xl">
        Aceitar o convite e criar sua conta
      </h1>
      <p class="max-w-[48ch] text-base leading-relaxed text-ink-body">
        Você foi convidado para responder às requisições de titulares. Confira o vínculo ao
        lado antes de concluir.
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
      v-if="failure === 'utilizado'"
      title="Este convite já foi usado"
      size="md"
    >
      <p>
        A conta deste convite foi criada enquanto esta página estava aberta. Entre com ela
        para acessar o painel.
      </p>
      <div class="pt-0.5">
        <BaseButton
          :to="{ name: 'login', query: { email: invite.email } }"
          size="sm"
        >
          Ir para o login
        </BaseButton>
      </div>
    </BaseAlert>

    <BaseAlert
      v-if="failure === 'inesperada'"
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
        v-model="invitedEmail"
        label="E-mail do convite"
        type="email"
        autocomplete="email"
        locked
        hint="Este endereço vem do convite e não pode ser alterado. Para usar outro, peça um novo convite a quem administra a organização."
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

      <div class="pt-0.5">
        <BaseButton
          type="submit"
          block
          :busy="status === 'sending'"
        >
          {{ submitLabel }}
        </BaseButton>
      </div>
    </div>
  </form>
</template>
