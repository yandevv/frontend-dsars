<script setup lang="ts">
import { RouterLink } from 'vue-router'

import { DEMO_INVITES } from '@/features/auth/data/invites'

/**
 * Os três links de convite que o protótipo reconhece.
 *
 * Um convite chega por e-mail, então não há como alcançar os outros estados
 * pela navegação — sem esta lista, só o caminho feliz seria demonstrável. Sai
 * junto com o serviço falso.
 */
const labels: Record<string, string> = {
  'convite-valido': 'Convite em aberto',
  'convite-expirado': 'Convite vencido',
  'convite-usado': 'Convite já utilizado',
}
</script>

<template>
  <aside
    aria-labelledby="convites-demo"
    class="flex flex-col gap-3 border border-line-strong bg-line px-[18px] py-3.5"
  >
    <p
      id="convites-demo"
      class="font-label text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-soft"
    >
      Só no protótipo
    </p>

    <ul
      role="list"
      class="flex list-none flex-col gap-1.5"
    >
      <li
        v-for="invite in DEMO_INVITES"
        :key="invite.token"
        class="text-sm leading-normal text-ink-body"
      >
        <RouterLink
          :to="{ name: 'invite', params: { token: invite.token } }"
          class="font-medium text-brand hover:text-brand-strong"
        >
          {{ labels[invite.token] }}
        </RouterLink>
        · {{ invite.email }}
      </li>
      <li class="text-sm leading-normal text-ink-body">
        <RouterLink
          :to="{ name: 'invite', params: { token: 'nao-existe' } }"
          class="font-medium text-brand hover:text-brand-strong"
        >
          Convite inexistente
        </RouterLink>
        · qualquer outro código
      </li>
    </ul>
  </aside>
</template>
