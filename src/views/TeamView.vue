<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

import AppShell from '@/shared/layout/AppShell.vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import InviteMemberDialog from '@/features/team/components/InviteMemberDialog.vue'
import PermissionsTable from '@/features/team/components/PermissionsTable.vue'
import TeamInvitesList from '@/features/team/components/TeamInvitesList.vue'
import TeamMembersList from '@/features/team/components/TeamMembersList.vue'
import { fetchTeam, inviteStatus, resendInvite } from '@/features/team/services/teamService'
import { messageOf } from '@/shared/api/ApiError'
import { useSession } from '@/features/auth/composables/useSession'
import type { Invite } from '@/features/auth/types/invite'
import type { TeamMemberWorkload } from '@/features/team/types/team'

/**
 * Equipe e permissões.
 *
 * Sem design no projeto: segue a linguagem das configurações. Quem atende,
 * com a carga de cada um; os convites em aberto; e o que cada perfil pode
 * fazer. Só há um perfil do lado da organização — o de encarregado —, e ele
 * só é dado por convite.
 */
const router = useRouter()
const { account } = useSession('encarregado')

const members = ref<TeamMemberWorkload[]>([])
const invites = ref<Invite[]>([])
const loading = ref(true)
const notice = ref('')
const busyToken = ref<string>()

const inviteOpen = ref(false)

async function load() {
  const team = await fetchTeam()
  members.value = team.members
  invites.value = team.invites
  loading.value = false
}

onMounted(load)

const pendingCount = computed(
  () => invites.value.filter((invite) => inviteStatus(invite) === 'pendente').length,
)

function linkOf(invite: Invite): string {
  const path = router.resolve({ name: 'invite', params: { token: invite.token } }).href
  return new URL(path, window.location.origin).href
}

async function copy(invite: Invite) {
  try {
    await navigator.clipboard.writeText(linkOf(invite))
    notice.value = `Link do convite para ${invite.email} copiado.`
  } catch {
    // Sem permissão de área de transferência: o link fica à vista para copiar à mão.
    notice.value = `Não foi possível copiar. Link do convite: ${linkOf(invite)}`
  }
}

async function onInvited(invite: Invite) {
  notice.value = `Convite enviado para ${invite.email}.`
  await load()
}

async function resend(invite: Invite) {
  busyToken.value = invite.email
  try {
    const renewed = await resendInvite(invite, account.value)
    notice.value = `Novo convite enviado para ${renewed.email}. O anterior deixou de valer.`
    await load()
  } catch (error) {
    notice.value = messageOf(error)
  } finally {
    busyToken.value = undefined
  }
}
</script>

<template>
  <AppShell role="encarregado">
    <div class="mx-auto flex max-w-[1200px] flex-col gap-7">
      <div class="flex flex-wrap items-start justify-between gap-6">
        <div class="flex max-w-[720px] flex-col gap-2">
          <h1 class="font-serif text-[26px] font-semibold leading-[1.15] text-ink sm:text-[32px]">
            Equipe e permissões
          </h1>
          <p class="text-[15px] leading-relaxed text-ink-soft">
            Quem atende requisições pela organização, os convites em aberto e o que cada perfil pode
            fazer na plataforma.
          </p>
        </div>
        <BaseButton
          size="sm"
          @click="inviteOpen = true"
        >
          Convidar pessoa
        </BaseButton>
      </div>

      <div
        v-if="notice"
        role="status"
        class="flex flex-wrap items-center gap-3.5 border border-line-button bg-surface-muted py-4 pl-4 pr-5"
      >
        <span
          aria-hidden="true"
          class="w-[3px] self-stretch bg-brand"
        />
        <p class="min-w-0 flex-1 break-words text-[15px] leading-normal text-ink-body">
          {{ notice }}
        </p>
        <button
          type="button"
          class="py-1 text-sm text-brand underline hover:text-brand-strong"
          @click="notice = ''"
        >
          Fechar
        </button>
      </div>

      <p
        v-if="loading"
        role="status"
        class="text-[15px] text-ink-soft"
      >
        Carregando a equipe…
      </p>

      <template v-else>
        <section
          class="flex flex-col gap-3.5"
          aria-labelledby="titulo-pessoas"
        >
          <div class="flex flex-wrap items-baseline gap-3">
            <h2
              id="titulo-pessoas"
              class="font-serif text-[22px] font-semibold text-ink"
            >
              Pessoas
            </h2>
            <p class="text-sm text-ink-muted">
              {{ members.length }} com perfil de encarregado
            </p>
          </div>
          <p class="text-sm leading-relaxed text-ink-soft">
            A lista de pessoas e convites ainda é ilustrativa: a plataforma envia convites de
            verdade, mas ainda não oferece a consulta da equipe.
          </p>
          <TeamMembersList :members="members" />
        </section>

        <section
          class="flex flex-col gap-3.5"
          aria-labelledby="titulo-convites"
        >
          <div class="flex flex-wrap items-baseline gap-3">
            <h2
              id="titulo-convites"
              class="font-serif text-[22px] font-semibold text-ink"
            >
              Convites
            </h2>
            <p class="text-sm text-ink-muted">
              {{ pendingCount }} aguardando aceite
            </p>
          </div>
          <p
            v-if="invites.length === 0"
            class="border border-line px-5 py-6 text-[15px] text-ink-soft"
          >
            Nenhum convite em aberto. Quem for convidado aparece aqui até criar a conta.
          </p>
          <TeamInvitesList
            v-else
            :invites="invites"
            :busy-token="busyToken"
            @copy="copy"
            @resend="resend"
          />
        </section>

        <section
          class="flex flex-col gap-3.5"
          aria-labelledby="titulo-permissoes"
        >
          <h2
            id="titulo-permissoes"
            class="font-serif text-[22px] font-semibold text-ink"
          >
            O que cada perfil pode fazer
          </h2>
          <PermissionsTable />
          <p class="flex gap-3 text-sm leading-relaxed text-ink-soft">
            <span
              aria-hidden="true"
              class="w-[3px] shrink-0 self-stretch bg-field-disabled-line"
            />
            A tabela descreve a regra; quem a aplica é o servidor, a cada operação. Uma tentativa de
            acesso fora do perfil é recusada e fica registrada na trilha de auditoria.
          </p>
        </section>
      </template>
    </div>

    <InviteMemberDialog
      v-model:open="inviteOpen"
      :by="account"
      @invited="onInvited"
    />
  </AppShell>
</template>
