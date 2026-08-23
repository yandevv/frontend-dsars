<script setup lang="ts">
import { ref } from 'vue'

import BaseAlert from '@/shared/ui/BaseAlert.vue'
import InviteBond from '@/features/auth/components/InviteBond.vue'
import { declineInvite } from '@/features/auth/services/inviteService'
import type { Invite } from '@/features/auth/types/invite'
import type { Tenant } from '@/features/tenant/types/tenant'

/** Coluna de apoio do convite: o vínculo, o que o perfil permite e a recusa. */
const { invite, tenant, accepted = false } = defineProps<{
  invite: Invite
  tenant: Tenant
  /** Conta já criada: não há mais o que recusar. */
  accepted?: boolean
}>()

const declineStatus = ref<'idle' | 'sending' | 'declined'>('idle')

async function decline() {
  if (declineStatus.value !== 'idle') return

  declineStatus.value = 'sending'
  try {
    await declineInvite(invite.token)
    declineStatus.value = 'declined'
  } catch {
    declineStatus.value = 'idle'
  }
}
</script>

<template>
  <InviteBond
    :invite="invite"
    :tenant="tenant"
  />

  <section
    aria-labelledby="convite-perfil"
    class="flex flex-col gap-3"
  >
    <h2
      id="convite-perfil"
      class="font-serif text-[22px] font-semibold text-ink"
    >
      O que o perfil de encarregado permite
    </h2>
    <p class="text-[15px] leading-relaxed text-ink-body">
      Ver e responder as requisições dirigidas a esta organização, pedir informações
      complementares ao titular, encerrar atendimentos e consultar a trilha de auditoria.
    </p>
    <p class="text-[15px] leading-relaxed text-ink-body">
      O perfil não é escolhido no cadastro: ele vem deste convite e está vinculado a esta
      organização. Se você também for titular de dados em outra organização, use uma conta
      própria para isso.
    </p>
  </section>

  <div
    v-if="!accepted"
    class="flex flex-col gap-2 border-t border-line pt-[22px]"
  >
    <BaseAlert
      v-if="declineStatus === 'declined'"
      variant="success"
      title="Convite recusado"
    >
      <p>
        Avisamos {{ invite.invitedBy }}. Este link não vale mais — se foi engano, peça um
        novo convite.
      </p>
    </BaseAlert>

    <template v-else>
      <p class="text-[15px] leading-relaxed text-ink-body">
        Não reconhece este convite?
      </p>
      <div>
        <button
          type="button"
          class="text-[15px] font-medium text-brand underline-offset-4 hover:text-brand-strong hover:underline disabled:text-ink-soft"
          :disabled="declineStatus === 'sending'"
          @click="decline"
        >
          {{
            declineStatus === 'sending'
              ? 'Recusando…'
              : 'Recusar o convite e avisar a organização'
          }}
        </button>
      </div>
    </template>
  </div>
</template>
