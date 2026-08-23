<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import AuthChrome from '@/features/auth/components/AuthChrome.vue'
import AuthLayout from '@/features/auth/components/AuthLayout.vue'
import AuthSupportContact from '@/features/auth/components/AuthSupportContact.vue'
import DemoInviteNotice from '@/features/auth/components/DemoInviteNotice.vue'
import InviteAside from '@/features/auth/components/InviteAside.vue'
import InviteForm from '@/features/auth/components/InviteForm.vue'
import InviteUnavailable from '@/features/auth/components/InviteUnavailable.vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import { InviteError, fetchInvite } from '@/features/auth/services/inviteService'
import { formatDate } from '@/shared/utils/date'
import { useTenant } from '@/features/tenant/composables/useTenant'
import type { InviteFailure } from '@/features/auth/services/inviteService'
import type { Invite } from '@/features/auth/types/invite'

/**
 * Cadastro por convite (`Registro de Conta.dc.html`, quadro 1c).
 *
 * O token vem da URL porque o convite é um link nominal enviado por e-mail —
 * é a tela buscá-lo e decidir entre o formulário e a recusa, deixando os dois
 * componentes alheios ao roteador.
 */
const { tenant } = useTenant()
const route = useRoute()

const invite = ref<Invite>()
const failure = ref<InviteFailure>()
const refusedInvite = ref<Invite>()
const loading = ref(true)
const accepted = ref(false)

const token = computed(() => String(route.params.token ?? ''))

const validUntil = computed(() =>
  invite.value ? `Convite válido até ${formatDate(invite.value.expiresAt)}` : '',
)

watch(
  token,
  async (value) => {
    loading.value = true
    invite.value = undefined
    failure.value = undefined
    refusedInvite.value = undefined
    accepted.value = false

    try {
      invite.value = await fetchInvite(value)
    } catch (error) {
      if (error instanceof InviteError) {
        failure.value = error.reason
        refusedInvite.value = error.invite
      } else {
        failure.value = 'invalido'
      }
    } finally {
      loading.value = false
    }
  },
  { immediate: true },
)
</script>

<template>
  <AuthLayout
    v-if="invite"
    :tenant="tenant"
    tagline="Convite para atuar como encarregado de proteção de dados"
    tone="dark-surface"
  >
    <template #header-action>
      <span
        class="font-label hidden text-xs font-semibold uppercase tracking-[0.06em] text-ink-on-dark md:inline"
      >
        {{ validUntil }}
      </span>
    </template>

    <InviteForm
      :invite="invite"
      @accepted="accepted = true"
    />

    <template #aside>
      <InviteAside
        :invite="invite"
        :tenant="tenant"
        :accepted="accepted"
      />
      <DemoInviteNotice />
    </template>
  </AuthLayout>

  <AuthChrome
    v-else
    :tenant="tenant"
  >
    <template #action>
      <BaseButton
        :to="{ name: 'login' }"
        variant="secondary"
        size="sm"
      >
        Entrar
      </BaseButton>
    </template>

    <main
      id="conteudo-principal"
      tabindex="-1"
      class="flex flex-1 justify-center bg-surface-muted px-5 py-10 lg:px-14 lg:py-16"
    >
      <div class="flex w-full max-w-[560px] flex-col gap-6">
        <p
          v-if="loading"
          role="status"
          class="border border-line bg-surface px-7 py-8 text-[15px] leading-relaxed text-ink-body"
        >
          Verificando o convite…
        </p>

        <template v-else-if="failure">
          <div class="border border-line bg-surface px-7 py-8">
            <InviteUnavailable
              :reason="failure"
              :invite="refusedInvite"
            />
          </div>

          <AuthSupportContact
            eyebrow="Dúvidas sobre o convite"
            :dpo="tenant.dpo"
          />

          <DemoInviteNotice />
        </template>
      </div>
    </main>
  </AuthChrome>
</template>
