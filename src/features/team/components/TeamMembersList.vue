<script setup lang="ts">
import { formatDate, relativeMoment } from '@/shared/utils/date'
import type { TeamMemberWorkload } from '@/features/team/types/team'

/**
 * Quem atende, com a carga de agora. As vencidas aparecem ao lado das abertas
 * porque é o que decide para quem vai a próxima requisição.
 */
defineProps<{ members: readonly TeamMemberWorkload[] }>()

function workload(member: TeamMemberWorkload): string {
  if (member.open === 0) return 'Nenhuma em aberto'
  return member.open === 1 ? '1 em aberto' : `${member.open} em aberto`
}
</script>

<template>
  <!-- Computador -->
  <div class="hidden border border-line md:block">
    <table class="w-full border-collapse text-left">
      <caption class="sr-only">
        Pessoas da equipe de atendimento
      </caption>
      <thead class="border-b border-line bg-surface-muted">
        <tr>
          <th
            v-for="heading in ['Pessoa', 'Função', 'Requisições', 'Na equipe desde', 'Último acesso']"
            :key="heading"
            scope="col"
            class="px-4 py-3.5 font-label text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-soft"
          >
            {{ heading }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="member in members"
          :key="member.email"
          class="border-b border-line-soft last:border-b-0"
        >
          <td class="px-4 py-4">
            <p class="flex flex-wrap items-center gap-2 text-[15px] font-semibold text-ink">
              {{ member.name }}
              <span
                v-if="member.lead"
                class="bg-brand px-2 py-0.5 font-label text-[11px] font-semibold uppercase tracking-[0.06em] text-white"
              >Responsável</span>
            </p>
            <p class="break-all text-[13px] text-ink-muted">
              {{ member.email }}
            </p>
          </td>
          <td class="px-4 py-4 text-[15px] text-ink">
            {{ member.jobTitle }}
          </td>
          <td class="px-4 py-4">
            <p class="text-[15px] text-ink">
              {{ workload(member) }}
            </p>
            <p
              v-if="member.overdue > 0"
              class="text-[13px] font-semibold text-danger"
            >
              {{ member.overdue }} fora do prazo
            </p>
          </td>
          <td class="px-4 py-4 text-[15px] text-ink">
            {{ formatDate(member.joinedAt) }}
          </td>
          <td class="px-4 py-4 text-[15px] text-ink-soft">
            {{ relativeMoment(member.lastAccessAt) }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Celular -->
  <ul class="flex flex-col gap-3 md:hidden">
    <li
      v-for="member in members"
      :key="member.email"
      class="flex flex-col gap-1.5 border border-line p-4"
    >
      <p class="flex flex-wrap items-center gap-2 text-base font-semibold text-ink">
        {{ member.name }}
        <span
          v-if="member.lead"
          class="bg-brand px-2 py-0.5 font-label text-[11px] font-semibold uppercase tracking-[0.06em] text-white"
        >Responsável</span>
      </p>
      <p class="text-sm text-ink-soft">
        {{ member.jobTitle }}
      </p>
      <p class="break-all text-[13px] text-ink-muted">
        {{ member.email }}
      </p>
      <p class="border-t border-line-soft pt-2 text-sm text-ink">
        {{ workload(member) }}
        <span
          v-if="member.overdue > 0"
          class="font-semibold text-danger"
        > · {{ member.overdue }} fora do prazo</span>
      </p>
    </li>
  </ul>
</template>
