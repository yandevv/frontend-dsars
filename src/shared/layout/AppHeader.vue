<script setup lang="ts">
import { onScopeDispose, ref, useTemplateRef, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import AccountPanel from '@/shared/layout/AccountPanel.vue'
import BaseLogo from '@/shared/ui/BaseLogo.vue'
import NotificationsPanel from '@/shared/layout/NotificationsPanel.vue'
import { endSession } from '@/features/auth/composables/useSession'
import { useNotifications } from '@/features/notifications/composables/useNotifications'
import type { Account } from '@/features/auth/types/auth'
import type { AppArea } from '@/shared/layout/types'
import type { Tenant } from '@/features/tenant/types/tenant'

/**
 * Cabeçalho das telas autenticadas.
 *
 * Os três painéis — avisos, conta e navegação em tela estreita — disputam o
 * mesmo canto, por isso vivem num único estado: abrir um fecha os outros, como
 * no design.
 */
const { tenant, area, account } = defineProps<{
  tenant: Tenant
  area: AppArea
  account: Account
}>()

type OpenPanel = 'none' | 'notifications' | 'account' | 'nav'

const open = ref<OpenPanel>('none')
const header = useTemplateRef<HTMLElement>('header')
const route = useRoute()
const router = useRouter()

const { notifications, unreadCount, markAllAsRead } = useNotifications(account.role)

function toggle(panel: Exclude<OpenPanel, 'none'>) {
  open.value = open.value === panel ? 'none' : panel
}

function onPointerDown(event: MouseEvent) {
  if (open.value === 'none') return
  if (!header.value?.contains(event.target as Node)) open.value = 'none'
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') open.value = 'none'
}

document.addEventListener('mousedown', onPointerDown)
document.addEventListener('keydown', onKeydown)
onScopeDispose(() => {
  document.removeEventListener('mousedown', onPointerDown)
  document.removeEventListener('keydown', onKeydown)
})

// Navegar por um link de dentro de um painel precisa fechá-lo: a rota muda sem
// que o ponteiro chegue a sair do cabeçalho.
watch(() => route.fullPath, () => { open.value = 'none' })

async function signOut() {
  endSession()
  await router.push({ name: 'login' })
}

const panelPosition = 'absolute right-0 top-[calc(100%+12px)] z-30'
</script>

<template>
  <header
    ref="header"
    class="relative border-b border-line bg-surface"
  >
    <div class="flex items-center justify-between gap-6 px-5 py-3.5 lg:px-10 lg:py-4">
      <RouterLink
        :to="area.nav[0]?.to ?? { name: 'home' }"
        class="flex items-center gap-2.5 no-underline lg:gap-3"
      >
        <BaseLogo
          size="sm"
          class="lg:hidden"
        />
        <BaseLogo class="hidden lg:block" />
        <span class="flex flex-col gap-px">
          <span class="font-serif text-sm font-semibold leading-tight text-ink lg:text-base">
            <span class="lg:hidden">{{ tenant.shortName }}</span>
            <span class="hidden lg:inline">{{ tenant.name }}</span>
          </span>
          <span class="hidden text-xs leading-tight text-ink-muted lg:block">
            {{ area.subtitle }}
          </span>
        </span>
      </RouterLink>

      <div class="flex items-center gap-1.5 lg:gap-6">
        <nav
          aria-label="Seções do sistema"
          class="hidden lg:block"
        >
          <ul class="flex gap-[22px]">
            <li
              v-for="item in area.nav"
              :key="item.label"
            >
              <RouterLink
                :to="item.to"
                class="block pb-[3px] text-[15px] text-ink-soft no-underline hover:text-ink"
                active-class="border-b-2 border-brand font-semibold text-ink"
              >
                {{ item.label }}
              </RouterLink>
            </li>
          </ul>
        </nav>

        <div class="flex items-center gap-1.5 lg:gap-2 lg:border-l lg:border-line lg:pl-5">
          <button
            type="button"
            class="relative flex size-11 items-center justify-center border"
            :class="open === 'notifications' ? 'border-brand bg-brand-wash' : 'border-line-strong bg-surface'"
            :aria-expanded="open === 'notifications'"
            @click="toggle('notifications')"
          >
            <span class="sr-only">Notificações</span>
            <svg
              aria-hidden="true"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.7"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-ink"
            >
              <path d="M12 3.5a5 5 0 0 0-5 5v3.2L5.5 15h13L17 11.7V8.5a5 5 0 0 0-5-5z" />
              <path d="M9.8 18a2.2 2.2 0 0 0 4.4 0" />
            </svg>
            <span
              v-if="unreadCount > 0"
              class="absolute -right-[7px] -top-[7px] flex h-5 min-w-5 items-center justify-center border-2 border-surface bg-danger px-[5px] font-label text-xs font-bold text-white"
            >
              {{ unreadCount }}
              <span class="sr-only">avisos não lidos</span>
            </span>
          </button>

          <button
            type="button"
            class="hidden h-11 items-center gap-2.5 border px-4 text-[15px] font-medium text-ink lg:flex"
            :class="open === 'account' ? 'border-brand bg-brand-wash' : 'border-line-strong bg-surface'"
            :aria-expanded="open === 'account'"
            @click="toggle('account')"
          >
            <span>{{ account.name.split(' ').slice(0, 2).join(' ') }}</span>
            <span
              aria-hidden="true"
              class="font-label text-[11px] text-ink-soft"
            >▾</span>
          </button>

          <button
            type="button"
            class="hidden px-2 py-[11px] text-[15px] font-medium text-brand hover:text-brand-strong lg:block"
            @click="signOut"
          >
            Sair
          </button>

          <button
            type="button"
            class="flex size-11 flex-col items-center justify-center gap-1 border border-line-strong lg:hidden"
            :aria-expanded="open === 'nav'"
            @click="toggle('nav')"
          >
            <span class="sr-only">Menu</span>
            <span
              v-for="line in 3"
              :key="line"
              aria-hidden="true"
              class="h-0.5 w-[18px] bg-ink"
            />
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="open === 'notifications'"
      :class="panelPosition"
      class="mr-4 lg:mr-[118px]"
    >
      <NotificationsPanel
        :notifications="notifications"
        @mark-all-read="markAllAsRead"
      />
    </div>

    <div
      v-if="open === 'account'"
      :class="panelPosition"
      class="mr-10"
    >
      <AccountPanel
        :account="account"
        :area="area"
        @sign-out="signOut"
      />
    </div>

    <div
      v-if="open === 'nav'"
      class="absolute inset-x-0 top-full z-30 border-b border-line bg-surface shadow-[0_8px_20px_rgba(16,20,19,0.18)] lg:hidden"
    >
      <nav aria-label="Seções do sistema">
        <ul class="flex flex-col border-b border-line">
          <li
            v-for="item in area.nav"
            :key="item.label"
          >
            <RouterLink
              :to="item.to"
              class="block px-5 py-3.5 text-base text-ink no-underline"
              active-class="font-semibold text-brand"
            >
              {{ item.label }}
            </RouterLink>
          </li>
        </ul>
      </nav>
      <AccountPanel
        :account="account"
        :area="area"
        class="w-full border-0 shadow-none"
        @sign-out="signOut"
      />
    </div>
  </header>
</template>
