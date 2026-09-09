<script setup lang="ts">
import { RouterLink } from "vue-router";

import AppBreadcrumb from "@/shared/layout/AppBreadcrumb.vue";
import AppShell from "@/shared/layout/AppShell.vue";
import type { AccountRole } from "@/features/auth/types/auth";
import type { SettingsSection } from "@/features/settings/types/profile";

/**
 * A moldura das configurações: um hub e três seções no mesmo lugar.
 *
 * A navegação lateral fica sempre à vista no computador; no celular vira uma
 * faixa de abas no alto, para a pessoa saber em que seção está sem voltar ao
 * hub a cada troca.
 */
const { role, section, title, subtitle } = defineProps<{
  role: AccountRole;
  section: SettingsSection;
  title: string;
  subtitle: string;
}>();

const SECTIONS: { key: SettingsSection; label: string; summary: string; to: string }[] = [
  { key: "hub", label: "Visão geral", summary: "As três seções em um lugar", to: "settings" },
  {
    key: "dados",
    label: "Dados pessoais",
    summary: "Nome, e-mail, documento e telefone",
    to: "personal-data",
  },
  {
    key: "seguranca",
    label: "Segurança",
    summary: "Senha e sessões ativas",
    to: "security-settings",
  },
  {
    key: "notificacoes",
    label: "Notificações",
    summary: "Eventos por canal",
    to: "notification-settings",
  },
];
</script>

<template>
  <AppShell :role="role">
    <div class="mx-auto flex max-w-[1360px] flex-col gap-6">
      <div class="flex flex-col gap-2">
        <AppBreadcrumb
          v-if="section !== 'hub'"
          :trail="[{ label: 'Configurações', to: { name: 'settings' } }]"
          :current="title"
        />
        <h1 class="font-serif text-[26px] font-semibold leading-[1.15] text-ink sm:text-[32px]">
          {{ title }}
        </h1>
        <p class="max-w-[84ch] text-[15px] leading-relaxed text-ink-soft">{{ subtitle }}</p>
      </div>

      <div class="grid items-start gap-6 lg:grid-cols-[268px_minmax(0,1fr)] lg:gap-8">
        <nav aria-label="Seções das configurações">
          <!-- Computador: lista com resumo de cada seção. -->
          <ul class="hidden flex-col border border-line lg:flex">
            <li v-for="item in SECTIONS" :key="item.key">
              <RouterLink
                :to="{ name: item.to }"
                :aria-current="item.key === section ? 'page' : undefined"
                class="flex flex-col gap-[3px] border-b border-l-4 border-b-line-soft px-[18px] py-4 text-left no-underline hover:bg-surface-subtle"
                :class="
                  item.key === section
                    ? 'border-l-brand bg-surface-muted'
                    : 'border-l-transparent bg-surface'
                "
              >
                <span
                  class="text-[15px] text-ink"
                  :class="item.key === section ? 'font-semibold' : ''"
                >
                  {{ item.label }}
                </span>
                <span class="text-[13px] leading-snug text-ink-muted">{{ item.summary }}</span>
              </RouterLink>
            </li>
          </ul>

          <!-- Celular: abas roláveis. -->
          <ul class="flex gap-5 overflow-x-auto border-b border-line lg:hidden">
            <li v-for="item in SECTIONS" :key="item.key" class="shrink-0">
              <RouterLink
                :to="{ name: item.to }"
                :aria-current="item.key === section ? 'page' : undefined"
                class="-mb-px block border-b-2 pb-2.5 pt-1 text-[15px] no-underline"
                :class="
                  item.key === section
                    ? 'border-brand font-semibold text-ink'
                    : 'border-transparent text-ink-soft'
                "
              >
                {{ item.label }}
              </RouterLink>
            </li>
          </ul>
        </nav>

        <div class="flex min-w-0 flex-col gap-[22px]">
          <slot />
        </div>
      </div>
    </div>
  </AppShell>
</template>
