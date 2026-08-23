<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef } from 'vue'
import { RouterLink } from 'vue-router'

import BaseAlert from '@/shared/ui/BaseAlert.vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import BaseCheckbox from '@/shared/ui/BaseCheckbox.vue'
import BaseField from '@/shared/ui/BaseField.vue'
import GoogleAuthButton from '@/shared/ui/GoogleAuthButton.vue'
import DemoCredentialsNotice from '@/features/auth/components/DemoCredentialsNotice.vue'
import { useLoginAttempts } from '@/features/auth/composables/useLoginAttempts'
import {
  LOGIN_LOCKOUT_MINUTES,
  LOGIN_MAX_ATTEMPTS,
  SESSION_IDLE_MINUTES,
  SESSION_PERSISTENT_DAYS,
  attemptsInWords,
} from '@/features/auth/constants/loginPolicy'
import { resendConfirmation } from '@/features/auth/services/accountService'
import { SignInError, signIn } from '@/features/auth/services/sessionService'
import type { Account, AccountRole } from '@/features/auth/types/auth'

/**
 * Acesso à conta (RF003, RN008 a RN010).
 *
 * Duas decisões vêm direto do RN009 e valem ser ditas: a recusa é igual para
 * e-mail errado e senha errada, e nenhum dos dois campos é marcado em vermelho
 * nem recebe o foco de volta. Apontar o campo errado contaria a um estranho
 * quais endereços têm conta neste portal — por isso o foco vai para o aviso,
 * que fala dos dois campos ao mesmo tempo.
 */
const { initialEmail = '', sessionExpired = false } = defineProps<{
  /** Endereço trazido de outra tela, como a recusa de e-mail já cadastrado. */
  initialEmail?: string
  /** Chegada por sessão encerrada por inatividade (RN010). */
  sessionExpired?: boolean
}>()

const email = ref(initialEmail)
const password = ref('')
const keepSignedIn = ref(false)
const showPassword = ref(false)

const status = ref<'idle' | 'authenticating' | 'signed-in'>('idle')
const failure = ref<'credentials' | 'unconfirmed' | 'unexpected' | null>(null)
const account = ref<Account | null>(null)
const resendStatus = ref<'idle' | 'sending' | 'sent'>('idle')

const alert = useTemplateRef<HTMLElement>('alert')
const emailField = useTemplateRef<InstanceType<typeof BaseField>>('emailField')

const { attempts, remaining, isLocked, countdown, registerFailure, reset } = useLoginAttempts()

const isBusy = computed(() => status.value === 'authenticating')
const fieldsLocked = computed(() => isBusy.value || isLocked.value)

/** O aviso do RN010 some assim que houver qualquer outro retorno na tela. */
const showSessionExpired = computed(() => sessionExpired && failure.value === null && !isLocked.value)

/** Há algo a anunciar — e, portanto, algo para onde mandar o foco. */
const hasAlert = computed(
  () => showSessionExpired.value || isLocked.value || failure.value !== null,
)

const failureText = computed(() =>
  remaining.value === 1
    ? 'Confira os dois campos e tente novamente. Resta 1 tentativa antes do bloqueio temporário.'
    : `Confira os dois campos e tente novamente. Restam ${remaining.value} tentativas antes do bloqueio temporário.`,
)

const lockoutText = computed(
  () =>
    `Houve ${attemptsInWords(LOGIN_MAX_ATTEMPTS)} tentativas seguidas sem sucesso. É uma proteção da conta, não uma falha do portal.`,
)

const attemptsCounter = computed(() =>
  attempts.value > 0 && !isLocked.value
    ? `Tentativas usadas: ${attempts.value} de ${LOGIN_MAX_ATTEMPTS}`
    : '',
)

const keepSignedInText = computed(() =>
  keepSignedIn.value
    ? `Esta sessão vale ${SESSION_PERSISTENT_DAYS} dias neste aparelho, mesmo se você fechar o navegador. Evite em computador compartilhado.`
    : `Sem marcar, a sessão encerra após ${SESSION_IDLE_MINUTES} minutos sem uso. Marcando, ela passa a valer ${SESSION_PERSISTENT_DAYS} dias neste aparelho.`,
)

const submitLabel = computed(() => {
  if (isBusy.value) return 'Entrando…'
  if (isLocked.value) return 'Acesso bloqueado'
  return 'Entrar'
})

const ROLE_LABELS: Record<AccountRole, string> = {
  titular: 'titular',
  encarregado: 'encarregado',
}

const DESTINATIONS: Record<AccountRole, string> = {
  titular: 'O destino desta conta é o portal de requisições: seus pedidos, prazos e respostas.',
  encarregado:
    'O destino desta conta é o painel de atendimento: a fila de requisições da organização.',
}

/** Leva junto o endereço já digitado, para não pedir duas vezes a mesma coisa. */
const recoveryRoute = computed(() => ({
  name: 'password-recovery',
  query: email.value.trim() ? { email: email.value.trim() } : undefined,
}))

const sessionText = computed(() =>
  keepSignedIn.value
    ? `Token válido por ${SESSION_PERSISTENT_DAYS} dias, conforme a opção manter-me conectado.`
    : `Sessão expira após ${SESSION_IDLE_MINUTES} minutos de inatividade.`,
)

async function focusAlert() {
  await nextTick()
  alert.value?.focus()
}

async function submit() {
  if (fieldsLocked.value) return

  failure.value = null

  // Campo vazio não é palpite de credencial, então não gasta uma tentativa.
  if (!email.value.trim() || !password.value) {
    failure.value = 'credentials'
    await focusAlert()
    return
  }

  status.value = 'authenticating'
  try {
    account.value = await signIn({ email: email.value.trim(), password: password.value })
    status.value = 'signed-in'
    reset()
  } catch (error) {
    status.value = 'idle'
    if (error instanceof SignInError && error.reason === 'email-nao-confirmado') {
      // Senha correta: não é tentativa frustrada e não conta para o bloqueio.
      failure.value = 'unconfirmed'
    } else if (error instanceof SignInError) {
      registerFailure()
      failure.value = 'credentials'
    } else {
      failure.value = 'unexpected'
    }
    await focusAlert()
  }
}

async function resend() {
  if (resendStatus.value === 'sending') return

  resendStatus.value = 'sending'
  try {
    await resendConfirmation(email.value.trim())
    resendStatus.value = 'sent'
  } catch {
    resendStatus.value = 'idle'
  }
}

async function correctEmail() {
  failure.value = null
  resendStatus.value = 'idle'
  password.value = ''
  await nextTick()
  emailField.value?.focus()
}

function clearAttempts() {
  reset()
  failure.value = null
}
</script>

<template>
  <div
    v-if="status === 'signed-in' && account"
    class="flex flex-col gap-[18px]"
  >
    <BaseAlert
      variant="success"
      size="md"
      :title="`Autenticado como ${ROLE_LABELS[account.role]}`"
    >
      <p>{{ DESTINATIONS[account.role] }}</p>
      <p>Essa tela ainda não faz parte desta entrega.</p>
      <p class="text-ink-soft">
        {{ sessionText }}
      </p>
    </BaseAlert>
  </div>

  <form
    v-else
    class="flex flex-col gap-[26px]"
    novalidate
    @submit.prevent="submit"
  >
    <div class="flex flex-col gap-2.5">
      <h1 class="font-serif text-3xl font-semibold leading-tight text-ink lg:text-4xl">
        Entrar
      </h1>
      <p class="max-w-[46ch] text-base leading-relaxed text-ink-body">
        Use o e-mail da conta. O portal leva você direto ao ambiente do seu perfil,
        sem perguntar qual é.
      </p>
    </div>

    <div
      v-if="hasAlert"
      ref="alert"
      tabindex="-1"
      class="flex flex-col gap-[26px]"
    >
      <!-- RN010: chegada depois de a sessão cair por inatividade. -->
      <BaseAlert
        v-if="showSessionExpired"
        variant="success"
        size="md"
        title="Sua sessão expirou por inatividade"
      >
        <p>
          Ficamos {{ SESSION_IDLE_MINUTES }} minutos sem atividade e encerramos a sessão
          para proteger os dados abertos na tela. Entre novamente para continuar de onde parou.
        </p>
        <p class="text-ink-soft">
          Nada do que você enviou foi perdido: requisições registradas seguem na sua lista.
        </p>
      </BaseAlert>

      <!-- RN008: bloqueio temporário, com o tempo que ainda falta. -->
      <BaseAlert
        v-if="isLocked"
        framed
        size="md"
        :title="`Acesso bloqueado por ${LOGIN_LOCKOUT_MINUTES} minutos`"
      >
        <p>{{ lockoutText }}</p>
        <p class="flex items-baseline gap-2.5">
          <span class="font-label text-[34px] font-bold leading-none text-danger-strong">
            {{ countdown }}
          </span>
          <span>até liberar</span>
        </p>
        <p>
          Se a senha não é mais lembrada,
          <RouterLink
            :to="recoveryRoute"
            class="font-medium underline"
          >
            recupere o acesso agora
          </RouterLink>
          — isso libera a conta sem esperar.
        </p>
      </BaseAlert>

      <!-- RN009: mesma recusa para e-mail e para senha. -->
      <BaseAlert
        v-else-if="failure === 'credentials'"
        title="E-mail ou senha incorretos"
      >
        <p>{{ failureText }}</p>
      </BaseAlert>

      <!-- RN005: a senha confere, mas o link de confirmação nunca foi aberto. -->
      <BaseAlert
        v-else-if="failure === 'unconfirmed'"
        variant="warning"
        size="md"
        title="Falta confirmar o e-mail desta conta"
      >
        <p>
          A senha está correta, mas o link enviado para {{ email.trim() }} ainda não foi
          aberto. Sem essa confirmação não podemos vincular os pedidos a você com segurança.
        </p>
        <div class="flex flex-wrap gap-2.5 pt-0.5">
          <BaseButton
            size="sm"
            :busy="resendStatus === 'sending'"
            @click="resend"
          >
            {{ resendStatus === 'sending' ? 'Reenviando…' : 'Reenviar o link' }}
          </BaseButton>
          <BaseButton
            size="sm"
            variant="secondary"
            @click="correctEmail"
          >
            Corrigir o e-mail
          </BaseButton>
        </div>
        <p
          v-if="resendStatus === 'sent'"
          role="status"
          class="text-brand"
        >
          Enviamos outro link para {{ email.trim() }}.
        </p>
        <p class="text-[13px] text-ink-muted">
          O link vale por 24 horas. Confira a caixa de spam antes de pedir outro.
        </p>
      </BaseAlert>

      <BaseAlert
        v-else-if="failure === 'unexpected'"
        title="Não conseguimos verificar o acesso agora"
      >
        <p>Houve uma falha ao falar com o servidor. Tente novamente em alguns instantes.</p>
      </BaseAlert>
    </div>

    <div class="flex flex-col gap-[18px]">
      <BaseField
        ref="emailField"
        v-model="email"
        label="E-mail"
        type="email"
        placeholder="nome@exemplo.com.br"
        autocomplete="email"
        :disabled="fieldsLocked"
      />

      <BaseField
        v-model="password"
        label="Senha"
        :type="showPassword ? 'text' : 'password'"
        placeholder="Sua senha"
        autocomplete="current-password"
        :disabled="fieldsLocked"
      >
        <template #action>
          <button
            type="button"
            class="py-1 text-sm font-medium text-brand underline hover:text-brand-strong"
            @click="showPassword = !showPassword"
          >
            {{ showPassword ? 'Ocultar senha' : 'Mostrar senha' }}
          </button>
        </template>
      </BaseField>

      <BaseCheckbox
        v-model="keepSignedIn"
        boxed
        :disabled="fieldsLocked"
      >
        <span class="text-[15px] font-semibold text-ink">Manter-me conectado</span>
        <span class="text-sm leading-normal text-ink-soft">{{ keepSignedInText }}</span>
      </BaseCheckbox>

      <div class="flex flex-col gap-3 pt-0.5">
        <BaseButton
          type="submit"
          block
          :busy="isBusy"
          :disabled="isLocked"
        >
          {{ submitLabel }}
        </BaseButton>
        <div class="flex flex-wrap items-center justify-between gap-4">
          <RouterLink
            :to="{ name: 'password-recovery' }"
            class="text-[15px] font-medium text-brand hover:text-brand-strong"
          >
            Esqueci minha senha
          </RouterLink>
          <span
            v-if="attemptsCounter"
            class="text-sm text-ink-muted"
          >{{ attemptsCounter }}</span>
        </div>
      </div>

      <div
        aria-hidden="true"
        class="flex items-center gap-3"
      >
        <span class="h-px flex-1 bg-line" />
        <span class="text-[13px] text-ink-muted">ou</span>
        <span class="h-px flex-1 bg-line" />
      </div>

      <GoogleAuthButton label="Entrar com o Google" />
    </div>
  </form>

  <DemoCredentialsNotice @reset="clearAttempts" />
</template>
