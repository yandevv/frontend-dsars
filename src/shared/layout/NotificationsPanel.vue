<script setup lang="ts">
import { computed } from 'vue'

import { relativeMoment } from '@/shared/utils/date'
import type { AppNotification } from '@/features/notifications/types/notification'

/**
 * Lista de avisos aberta pelo sino do cabeçalho.
 *
 * Mostra os cinco mais recentes; o resto fica na página de notificações. Cada
 * linha é uma ação: acionar leva ao recurso e marca o aviso como lido.
 *
 * O fundo levemente acinzentado e o quadrado à esquerda marcam o que ainda não
 * foi lido — dois sinais para a mesma informação, porque cor sozinha não basta.
 */
const { notifications, unreadCount } = defineProps<{
  notifications: readonly AppNotification[]
  unreadCount: number
}>()

defineEmits<{
  'mark-all-read': []
  open: [notification: AppNotification]
}>()

const latest = computed(() => notifications.slice(0, 5))

const heading = computed(() => {
  if (unreadCount === 0) return 'Notificações'
  return `Notificações · ${unreadCount} ${unreadCount === 1 ? 'não lida' : 'não lidas'}`
})
</script>

<template>
  <div
    class="flex w-[min(420px,calc(100vw-2rem))] flex-col border border-line-strong bg-surface shadow-[0_8px_20px_rgba(16,20,19,0.18)]"
  >
    <div
      class="flex items-center justify-between gap-4 border-b border-line bg-surface-muted px-[18px] py-3.5"
    >
      <p class="font-label text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-soft">
        {{ heading }}
      </p>
      <button
        v-if="unreadCount > 0"
        type="button"
        class="py-0.5 text-sm text-brand underline hover:text-brand-strong"
        @click="$emit('mark-all-read')"
      >
        Marcar todas como lidas
      </button>
    </div>

    <div
      v-if="latest.length === 0"
      class="flex flex-col gap-1 px-[18px] py-7"
    >
      <p class="text-[15px] font-semibold text-ink">
        Nada novo por aqui
      </p>
      <p class="text-sm leading-normal text-ink-soft">
        Avisamos assim que houver movimento nas suas requisições.
      </p>
    </div>

    <ul
      v-else
      class="flex flex-col"
    >
      <li
        v-for="notification in latest"
        :key="notification.id"
      >
        <button
          type="button"
          class="flex w-full gap-3 border-b border-line-soft px-[18px] py-4 text-left hover:bg-brand-wash"
          :class="notification.unread ? 'bg-surface-muted' : 'bg-surface'"
          @click="$emit('open', notification)"
        >
          <span
            aria-hidden="true"
            class="mt-[7px] size-2 shrink-0"
            :class="notification.unread ? 'bg-brand' : 'bg-line'"
          />
          <span class="flex flex-col gap-[3px]">
            <span
              class="text-[15px] leading-snug text-ink"
              :class="notification.unread ? 'font-semibold' : ''"
            >
              {{ notification.title }}
              <span
                v-if="notification.unread"
                class="sr-only"
              >(não lida)</span>
            </span>
            <span class="text-sm leading-normal text-ink-soft">
              {{ notification.detail }}
            </span>
            <span class="text-[13px] text-ink-faint">
              {{ relativeMoment(notification.at) }}
            </span>
          </span>
        </button>
      </li>
    </ul>

    <div class="px-[18px] py-3.5">
      <RouterLink
        :to="{ name: 'notifications' }"
        class="text-sm font-medium text-brand hover:text-brand-strong"
      >
        Ver todas as notificações
      </RouterLink>
    </div>
  </div>
</template>
