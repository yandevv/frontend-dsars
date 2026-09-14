<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import BaseAlert from '@/shared/ui/BaseAlert.vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import BaseCheckbox from '@/shared/ui/BaseCheckbox.vue'
import BaseField from '@/shared/ui/BaseField.vue'
import GoogleAuthButton from '@/shared/ui/GoogleAuthButton.vue'
import { startSession } from '@/features/auth/composables/useSession'
import { ROLE_HOME } from '@/features/auth/constants/roleHome'
import { SESSION_IDLE_MINUTES, SESSION_PERSISTENT_DAYS } from '@/features/auth/constants/loginPolicy'
import { signIn } from '@/features/auth/services/sessionService'
import { isApiError, messageOf } from '@/shared/api/ApiError'

/**
 * Acesso à conta (RF003, RN008 a RN010).
 *
 * A recusa é igual para e-mail errado, senha errada e conta bloqueada, e o
 * texto vem do servidor, que é quem conta as tentativas (RN008/RN009).
 * Nenhum dos campos é marcado em vermelho nem recebe o foco de volta: apontar
 * o campo errado contaria a um estranho quais endereços têm conta neste
 * portal — por isso o foco vai para o aviso, que fala dos dois campos.
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

const route = useRoute()
const router = useRouter()

const status = ref<'idle' | 'authenticating' | 'signed-in'>('idle')
const failure = ref<'empty' | 'refused' | 'unexpected' | null>(null)
const refusal = ref('')

const alert = useTemplateRef<HTMLElement>('alert')

// Autenticado, o formulário segue travado até a troca de tela terminar.
const isBusy = computed(() => status.value !== 'idle')

/** O aviso do RN010 some assim que houver qualquer outro retorno na tela. */
const showSessionExpired = computed(() => sessionExpired && failure.value === null)

/** Há algo a anunciar — e, portanto, algo para onde mandar o foco. */
const hasAlert = computed(() => showSessionExpired.value || failure.value !== null)

/** O efeito da caixa, dito antes de entrar — depois do acesso a tela já é outra. */
const sessionText = computed(() =>
  keepSignedIn.value
    ? `A sessão vale por ${SESSION_PERSISTENT_DAYS} dias neste aparelho.`
    : `A sessão expira após ${SESSION_IDLE_MINUTES} minutos sem atividade.`,
)

/** Volta para a tela que pediu o acesso, desde que seja uma rota deste portal. */
function destination(role: keyof typeof ROLE_HOME) {
  const redirect = route.query.redirect
  if (typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')) {
    return redirect
  }
  return ROLE_HOME[role]
}

async function focusAlert() {
  await nextTick()
  alert.value?.focus()
}

async function submit() {
  if (isBusy.value) return

  failure.value = null

  // Campo vazio não é palpite de credencial: nem chega ao servidor.
  if (!email.value.trim() || !password.value) {
    failure.value = 'empty'
    await focusAlert()
    return
  }

  status.value = 'authenticating'
  try {
    const account = await signIn({
      email: email.value.trim(),
      password: password.value,
      rememberMe: keepSignedIn.value,
    })
    startSession(account)
    status.value = 'signed-in'
    // `replace`: voltar do painel não deve cair de novo no formulário de acesso.
    await router.replace(destination(account.role))
  } catch (error) {
    status.value = 'idle'
    if (isApiError(error, 401) || isApiError(error, 429)) {
      failure.value = 'refused'
      refusal.value = messageOf(error)
    } else {
      failure.value = 'unexpected'
    }
    await focusAlert()
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

      <BaseAlert
        v-if="failure === 'empty'"
        title="Informe o e-mail e a senha"
      >
        <p>Preencha os dois campos para entrar.</p>
      </BaseAlert>

      <!-- RN008/RN009: a mesma recusa para e-mail, senha e conta bloqueada. -->
      <BaseAlert
        v-else-if="failure === 'refused'"
        title="Não foi possível entrar"
      >
        <p>{{ refusal }}</p>
        <p>
          Se a senha não é mais lembrada,
          <RouterLink
            :to="{ name: 'password-recovery', query: email.trim() ? { email: email.trim() } : undefined }"
            class="font-medium underline"
          >
            recupere o acesso
          </RouterLink>.
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
        v-model="email"
        label="E-mail"
        type="email"
        placeholder="nome@exemplo.com.br"
        autocomplete="email"
        :disabled="isBusy"
      />

      <BaseField
        v-model="password"
        label="Senha"
        :type="showPassword ? 'text' : 'password'"
        placeholder="Sua senha"
        autocomplete="current-password"
        :disabled="isBusy"
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
        :disabled="isBusy"
      >
        <span class="text-[15px] text-ink">Manter-me conectado</span>
        <span class="text-[13px] text-ink-muted">{{ sessionText }}</span>
      </BaseCheckbox>

      <div class="flex flex-col gap-3 pt-0.5">
        <BaseButton
          type="submit"
          block
          :busy="isBusy"
        >
          {{ isBusy ? 'Entrando…' : 'Entrar' }}
        </BaseButton>
        <div class="flex flex-wrap items-center justify-between gap-4">
          <RouterLink
            :to="{ name: 'password-recovery' }"
            class="text-[15px] font-medium text-brand hover:text-brand-strong"
          >
            Esqueci minha senha
          </RouterLink>
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

      <GoogleAuthButton
        label="Entrar com o Google"
        :remember-me="keepSignedIn"
      />
    </div>
  </form>
</template>
