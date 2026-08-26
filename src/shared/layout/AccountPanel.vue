<script setup lang="ts">
import type { Account } from '@/features/auth/types/auth'
import type { AppArea } from '@/shared/layout/types'

/** Menu aberto pelo nome de quem está na sessão. */
defineProps<{
  account: Account
  area: AppArea
}>()

defineEmits<{ 'sign-out': [] }>()
</script>

<template>
  <div
    class="flex w-[min(300px,calc(100vw-2rem))] flex-col border border-line-strong bg-surface shadow-[0_8px_20px_rgba(16,20,19,0.18)]"
  >
    <div class="flex flex-col gap-0.5 border-b border-line bg-surface-muted px-[18px] py-4">
      <p class="text-[15px] font-semibold text-ink">
        {{ account.name }}
      </p>
      <p class="break-all text-[13px] text-ink-muted">
        {{ account.email }}
      </p>
      <p class="text-[13px] text-ink-muted">
        Perfil: {{ area.roleLabel.toLowerCase() }}
      </p>
    </div>

    <ul class="flex flex-col py-2">
      <li
        v-for="link in area.accountLinks"
        :key="link.label"
      >
        <RouterLink
          :to="link.to"
          class="block px-[18px] py-3 text-[15px] text-ink no-underline hover:bg-surface-muted"
        >
          {{ link.label }}
        </RouterLink>
      </li>
    </ul>

    <div class="border-t border-line py-2">
      <button
        type="button"
        class="w-full px-[18px] py-3 text-left text-[15px] font-semibold text-brand hover:bg-surface-muted"
        @click="$emit('sign-out')"
      >
        Sair da conta
      </button>
    </div>
  </div>
</template>
