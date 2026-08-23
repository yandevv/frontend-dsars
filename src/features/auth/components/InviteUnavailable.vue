<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'

import BaseAlert from '@/shared/ui/BaseAlert.vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import { INVITE_VALIDITY_DAYS } from '@/features/auth/constants/invitePolicy'
import { requestNewInvite } from '@/features/auth/services/inviteService'
import { formatDate } from '@/shared/utils/date'
import type { InviteFailure } from '@/features/auth/services/inviteService'
import type { Invite } from '@/features/auth/types/invite'

/**
 * Convite que não leva ao formulário: vencido, já usado ou inexistente.
 *
 * Cada estado termina numa única ação de continuação, e nenhum deles é um beco
 * sem saída — o link quebrado de um encarregado não pode virar o fim da
 * conversa com a organização.
 */
const { reason, invite } = defineProps<{
  reason: InviteFailure
  /** Ausente quando o token não corresponde a convite nenhum. */
  invite?: Invite
}>()

const requestStatus = ref<'idle' | 'sending' | 'sent'>('idle')

const eyebrow = computed(
  () =>
    ({
      expirado: 'Convite expirado',
      utilizado: 'Convite já utilizado',
      invalido: 'Convite inválido',
    })[reason],
)

const title = computed(() => {
  if (reason === 'expirado') {
    return invite ? `Este convite venceu em ${formatDate(invite.expiresAt)}` : 'Este convite venceu'
  }
  if (reason === 'utilizado') return 'A conta deste convite já foi criada'
  return 'Não encontramos este convite'
})

async function requestAnother() {
  if (requestStatus.value !== 'idle' || !invite) return

  requestStatus.value = 'sending'
  try {
    await requestNewInvite(invite.token)
    requestStatus.value = 'sent'
  } catch {
    requestStatus.value = 'idle'
  }
}
</script>

<template>
  <div class="flex flex-col gap-3.5">
    <p class="font-label text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
      {{ eyebrow }}
    </p>
    <h1 class="font-serif text-[26px] font-semibold leading-tight text-ink">
      {{ title }}
    </h1>

    <p
      v-if="reason === 'expirado'"
      class="text-[15px] leading-relaxed text-ink-body"
    >
      Convites valem por {{ INVITE_VALIDITY_DAYS }} dias. Peça um novo a quem administra a
      organização — o vínculo e o perfil continuam os mesmos.
    </p>

    <p
      v-else-if="reason === 'utilizado'"
      class="text-[15px] leading-relaxed text-ink-body"
    >
      <template v-if="invite">
        O convite para
        <span class="font-semibold break-words">{{ invite.email }}</span>
        foi usado
        <template v-if="invite.usedAt">
          em {{ formatDate(invite.usedAt) }}
        </template>.
        Entre com essa conta para acessar o painel.
      </template>
      <template v-else>
        Entre com a conta criada por este convite para acessar o painel.
      </template>
    </p>

    <p
      v-else
      class="text-[15px] leading-relaxed text-ink-body"
    >
      O link pode ter sido copiado pela metade ou cancelado pela organização. Confira o
      e-mail que recebeu ou fale com quem o enviou.
    </p>

    <BaseAlert
      v-if="requestStatus === 'sent'"
      variant="success"
      title="Pedido registrado"
    >
      <p v-if="invite">
        Avisamos {{ invite.invitedBy }}. O novo convite chega em {{ invite.email }}.
      </p>
    </BaseAlert>

    <div
      v-else-if="reason === 'expirado'"
      class="pt-1"
    >
      <BaseButton
        :busy="requestStatus === 'sending'"
        @click="requestAnother"
      >
        {{ requestStatus === 'sending' ? 'Solicitando…' : 'Solicitar novo convite' }}
      </BaseButton>
    </div>

    <div
      v-else-if="reason === 'utilizado'"
      class="flex flex-wrap gap-2.5 pt-1"
    >
      <BaseButton :to="{ name: 'login', query: invite ? { email: invite.email } : {} }">
        Entrar
      </BaseButton>
      <BaseButton
        :to="{ name: 'password-recovery', query: invite ? { email: invite.email } : {} }"
        variant="secondary"
      >
        Esqueci a senha
      </BaseButton>
    </div>

    <p
      v-if="reason === 'invalido'"
      class="text-sm leading-relaxed text-ink-soft"
    >
      <RouterLink
        :to="{ name: 'register' }"
        class="text-brand hover:text-brand-strong"
      >
        Crie uma conta comum
      </RouterLink>
      se você é titular de dados e quer fazer um pedido: para isso não é preciso convite.
    </p>
  </div>
</template>
