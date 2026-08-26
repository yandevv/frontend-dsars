import { computed, ref, type ComputedRef, type Ref } from 'vue'

import { demoNotificationsFor } from '@/features/notifications/data/notifications'
import type { AccountRole } from '@/features/auth/types/auth'
import type { AppNotification } from '@/features/notifications/types/notification'

/**
 * Avisos do sino, para o perfil de quem está na tela.
 *
 * Como `useTenant()`, é a única emenda com a origem dos dados: trocar o corpo
 * daqui por uma chamada HTTP não exige tocar no cabeçalho.
 */
export function useNotifications(role: AccountRole): {
  notifications: ComputedRef<readonly AppNotification[]>
  unreadCount: ComputedRef<number>
  markAllAsRead: () => void
} {
  const allRead: Ref<boolean> = ref(false)

  const notifications = computed(() =>
    demoNotificationsFor(role).map((notification) => ({
      ...notification,
      unread: notification.unread && !allRead.value,
    })),
  )

  const unreadCount = computed(() => notifications.value.filter((item) => item.unread).length)

  return {
    notifications,
    unreadCount,
    markAllAsRead: () => {
      allRead.value = true
    },
  }
}
