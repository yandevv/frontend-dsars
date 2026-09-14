<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import BaseAlert from '@/shared/ui/BaseAlert.vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import { reloadSession, useSession } from '@/features/auth/composables/useSession'
import { acceptInvite } from '@/features/auth/services/inviteService'
import { messageOf } from '@/shared/api/ApiError'
import type { InvitePreview } from '@/features/auth/types/invite'

/**
 * Aceite do convite de encarregado.
 *
 * O convite não cria conta: ele vincula à organização a conta do endereço
 * convidado. Sem sessão, a tela leva ao acesso — ou ao cadastro — e volta
 * aqui; com a sessão de outro endereço, avisa antes de o servidor recusar.
 */
const { invite } = defineProps<{ invite: InvitePreview }>()

/** A coluna de apoio precisa saber que o vínculo foi aceito. */
const emit = defineEmits<{ accepted: [] }>()

const router = useRouter()
const { account } = useSession()

const status = ref<'idle' | 'sending' | 'accepted'>('idle')
const failure = ref('')

const signedIn = computed(() => account.value.id !== '')
const sameAccount = computed(
  () => account.value.email.toLowerCase() === invite.email.toLowerCase(),
)
const backHere = computed(() => `/convites/${invite.token}`)

async function accept() {
  if (status.value !== 'idle') return
  failure.value = ''
  status.value = 'sending'
  try {
    await acceptInvite(invite.token)
    await reloadSession()
    status.value = 'accepted'
    emit('accepted')
  } catch (error) {
    status.value = 'idle'
    failure.value = messageOf(error)
  }
}

async function goToPanel() {
  await router.push({ name: 'request-queue' })
}
</script>

<template>
  <div
    v-if="status === 'accepted'"
    class="flex flex-col gap-[18px]"
  >
    <BaseAlert
      variant="success"
      size="md"
      title="Vínculo aceito"
    >
      <p>
        Você agora responde como encarregado de proteção de dados de
        {{ invite.organizationName }}.
      </p>
    </BaseAlert>
    <BaseButton
      block
      @click="goToPanel"
    >
      Ir para o painel de atendimento
    </BaseButton>
  </div>

  <div
    v-else
    class="flex flex-col gap-[26px]"
  >
    <div class="flex flex-col gap-2.5">
      <h1 class="font-serif text-3xl font-semibold leading-tight text-ink lg:text-4xl">
        Aceitar o convite
      </h1>
      <p class="max-w-[48ch] text-base leading-relaxed text-ink-body">
        Você foi convidado para responder às requisições de titulares. Confira o vínculo ao
        lado antes de concluir.
      </p>
    </div>

    <div class="flex flex-col gap-1.5 border-l-[3px] border-brand bg-brand-wash px-4 py-4 md:px-[22px] md:py-5">
      <p class="text-[13px] text-ink-muted">
        Convite enviado para
      </p>
      <p class="break-all text-[17px] font-semibold text-brand md:text-xl">
        {{ invite.email }}
      </p>
    </div>

    <BaseAlert
      v-if="failure"
      title="Não foi possível aceitar o convite"
    >
      <p>{{ failure }}</p>
    </BaseAlert>

    <!-- Sem sessão: o aceite exige entrar com a conta do endereço convidado. -->
    <template v-if="!signedIn">
      <p class="text-[15px] leading-relaxed text-ink-body">
        Entre com a conta deste endereço para aceitar. Se ainda não tem conta, crie uma com
        este mesmo e-mail e volte a este link.
      </p>
      <div class="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
        <BaseButton :to="{ name: 'login', query: { redirect: backHere, email: invite.email } }">
          Entrar para aceitar
        </BaseButton>
        <BaseButton
          variant="secondary"
          :to="{ name: 'register' }"
        >
          Criar conta com este e-mail
        </BaseButton>
      </div>
    </template>

    <template v-else-if="!sameAccount">
      <BaseAlert
        variant="warning"
        size="md"
        title="Você entrou com outra conta"
      >
        <p>
          A sessão aberta é de {{ account.email }}, mas o convite é para {{ invite.email }}.
          Saia e entre com a conta que recebeu o convite.
        </p>
      </BaseAlert>
    </template>

    <BaseButton
      v-else
      block
      :busy="status === 'sending'"
      @click="accept"
    >
      {{ status === 'sending' ? 'Aceitando…' : 'Aceitar convite' }}
    </BaseButton>
  </div>
</template>
