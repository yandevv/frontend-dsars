<script setup lang="ts">
import { inviteStatus } from '@/features/team/services/teamService'
import { formatDate } from '@/shared/utils/date'
import type { Invite } from '@/features/auth/types/invite'
import type { InviteStatus } from '@/features/team/types/team'

/**
 * Os convites que ainda não viraram conta: pendentes, vencidos e revogados.
 * Revogar só vale para o pendente; reenviar, para os que não valem mais.
 */
defineProps<{ invites: readonly Invite[]; busyToken?: string }>()

defineEmits<{
  copy: [invite: Invite]
  revoke: [invite: Invite]
  resend: [invite: Invite]
}>()

const STATUS_LABELS: Record<InviteStatus, string> = {
  pendente: 'Aguardando aceite',
  vencido: 'Vencido',
  revogado: 'Revogado',
  aceito: 'Aceito',
}

const STATUS_CLASSES: Record<InviteStatus, string> = {
  pendente: 'border-brand-line bg-brand-wash text-brand',
  vencido: 'border-pending-line bg-pending-wash text-pending',
  revogado: 'border-line bg-field-disabled text-ink-soft',
  aceito: 'border-line bg-field-disabled text-ink-soft',
}

function validity(invite: Invite): string {
  const status = inviteStatus(invite)
  if (status === 'revogado' && invite.revokedAt) return `Revogado em ${formatDate(invite.revokedAt)}`
  if (status === 'vencido') return `Venceu em ${formatDate(invite.expiresAt)}`
  return `Vale até ${formatDate(invite.expiresAt)}`
}
</script>

<template>
  <ul class="flex flex-col border border-line">
    <li
      v-for="invite in invites"
      :key="invite.token"
      class="grid gap-3 border-b border-line-soft px-4 py-4 last:border-b-0 md:grid-cols-[minmax(0,1fr)_180px_auto] md:items-center md:gap-5 sm:px-5"
    >
      <div class="flex min-w-0 flex-col gap-1">
        <p class="break-all text-[15px] font-semibold text-ink">
          {{ invite.email }}
        </p>
        <p class="text-[13px] leading-normal text-ink-muted">
          {{ invite.jobTitle ?? 'Encarregado' }} · enviado por {{ invite.invitedBy }} em
          {{ formatDate(invite.issuedAt) }}
        </p>
      </div>
      <div class="flex flex-col items-start gap-1">
        <span
          class="border px-2 py-0.5 text-[13px] font-semibold"
          :class="STATUS_CLASSES[inviteStatus(invite)]"
        >
          {{ STATUS_LABELS[inviteStatus(invite)] }}
        </span>
        <span class="text-[13px] text-ink-muted">{{ validity(invite) }}</span>
      </div>
      <div class="flex flex-wrap items-center gap-4 md:justify-end">
        <template v-if="inviteStatus(invite) === 'pendente'">
          <button
            type="button"
            class="py-1 text-sm font-medium text-brand underline hover:text-brand-strong"
            @click="$emit('copy', invite)"
          >
            Copiar link<span class="sr-only"> do convite para {{ invite.email }}</span>
          </button>
          <button
            type="button"
            class="py-1 text-sm font-medium text-danger underline hover:text-danger-strong"
            :disabled="busyToken === invite.token"
            @click="$emit('revoke', invite)"
          >
            Revogar<span class="sr-only"> o convite para {{ invite.email }}</span>
          </button>
        </template>
        <button
          v-else
          type="button"
          class="py-1 text-sm font-medium text-brand underline hover:text-brand-strong disabled:opacity-55"
          :disabled="busyToken === invite.token"
          @click="$emit('resend', invite)"
        >
          {{ busyToken === invite.token ? 'Reenviando…' : 'Reenviar' }}<span class="sr-only">
            o convite para {{ invite.email }}</span>
        </button>
      </div>
    </li>
  </ul>
</template>
