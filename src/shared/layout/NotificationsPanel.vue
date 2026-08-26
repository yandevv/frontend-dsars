<script setup lang="ts">
import type { AppNotification } from '@/features/notifications/types/notification'

/**
 * Lista de avisos aberta pelo sino do cabeçalho.
 *
 * O fundo levemente acinzentado e o quadrado à esquerda marcam o que ainda não
 * foi lido — dois sinais para a mesma informação, porque cor sozinha não basta.
 */
defineProps<{
  notifications: readonly AppNotification[]
}>()

defineEmits<{ 'mark-all-read': [] }>()
</script>

<template>
  <div
    class="flex w-[min(420px,calc(100vw-2rem))] flex-col border border-line-strong bg-surface shadow-[0_8px_20px_rgba(16,20,19,0.18)]"
  >
    <div
      class="flex items-center justify-between gap-4 border-b border-line bg-surface-muted px-[18px] py-3.5"
    >
      <p class="font-label text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-soft">
        Notificações
      </p>
      <button
        type="button"
        class="py-0.5 text-sm text-brand underline hover:text-brand-strong"
        @click="$emit('mark-all-read')"
      >
        Marcar todas como lidas
      </button>
    </div>

    <ul class="flex flex-col">
      <li
        v-for="notification in notifications"
        :key="notification.id"
        class="flex gap-3 border-b border-line-soft px-[18px] py-4"
        :class="notification.unread ? 'bg-surface-muted' : 'bg-surface'"
      >
        <span
          aria-hidden="true"
          class="mt-[7px] size-2 shrink-0"
          :class="notification.unread ? 'bg-brand' : 'bg-line'"
        />
        <div class="flex flex-col gap-[3px]">
          <p class="text-[15px] font-semibold leading-snug text-ink">
            {{ notification.title }}
            <span
              v-if="notification.unread"
              class="sr-only"
            >(não lida)</span>
          </p>
          <p class="text-sm leading-normal text-ink-soft">
            {{ notification.detail }}
          </p>
          <p class="text-[13px] text-ink-faint">
            {{ notification.when }}
          </p>
        </div>
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
