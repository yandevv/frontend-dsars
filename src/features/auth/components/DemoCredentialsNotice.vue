<script setup lang="ts">
import { computed } from 'vue'
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '@/features/auth/data/accounts'

/**
 * Credenciais que o protótipo aceita, como no rodapé do quadro 1a do design.
 *
 * Sai da tela junto com o serviço falso: quando houver autenticação de
 * verdade, não haverá contas de demonstração para listar. Fica visível de
 * propósito — quem abre o projeto precisa saber com o que entrar, e esconder
 * isso num README não ajuda quem está com a tela na frente.
 */
const emit = defineEmits<{ reset: [] }>()

const accounts = computed(() =>
  DEMO_ACCOUNTS.map((account) => ({
    email: account.email,
    label: !account.emailConfirmed
      ? 'Titular com e-mail pendente'
      : account.role === 'encarregado'
        ? 'Encarregado'
        : 'Titular',
  })),
)
</script>

<template>
  <aside
    aria-labelledby="credenciais-demo"
    class="flex flex-col gap-3 border border-line-strong bg-line px-[18px] py-3.5"
  >
    <p
      id="credenciais-demo"
      class="font-label text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-soft"
    >
      Só no protótipo
    </p>

    <dl class="flex flex-col gap-1.5">
      <div
        v-for="account in accounts"
        :key="account.email"
        class="flex flex-wrap gap-x-2 text-sm leading-normal text-ink-body"
      >
        <dt class="font-semibold">
          {{ account.label }}:
        </dt>
        <dd class="break-words">
          {{ account.email }}
        </dd>
      </div>
    </dl>

    <p class="text-sm leading-normal text-ink-body">
      Senha <strong class="font-semibold">{{ DEMO_PASSWORD }}</strong> para todas.
      Qualquer outra combinação falha, como no sistema real.
    </p>

    <div>
      <button
        type="button"
        class="border border-field-line bg-surface px-4 py-2.5 text-sm font-medium text-ink hover:border-brand hover:text-brand"
        @click="emit('reset')"
      >
        Zerar tentativas
      </button>
    </div>
  </aside>
</template>
