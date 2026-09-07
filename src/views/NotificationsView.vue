<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import AppShell from "@/shared/layout/AppShell.vue";
import BaseButton from "@/shared/ui/BaseButton.vue";
import BaseDialog from "@/shared/ui/BaseDialog.vue";
import { currentRole, useSession } from "@/features/auth/composables/useSession";
import { momentGroup, relativeMoment } from "@/shared/utils/date";
import { useNotifications } from "@/features/notifications/composables/useNotifications";
import type {
  AppNotification,
  NotificationTone,
} from "@/features/notifications/types/notification";

/**
 * Turno 1 · Tela 15 — Notificações (RF023 a RF027).
 *
 * A mesma página para titular e encarregado: muda o conteúdo, não a mecânica.
 * Acionar um aviso leva ao recurso e o marca como lido; quando o recurso não
 * existe mais, a explicação aparece no próprio aviso em vez de um link morto.
 */
const route = useRoute();
const router = useRouter();
const role = currentRole();
const { account } = useSession(role);
const { notifications, unreadCount, markAsRead, markAllAsRead, clear } = useNotifications(
  account.value,
);

type Tab = "todas" | "nao-lidas" | "lidas";
const tab = ref<Tab>("todas");

/** O aviso cujo recurso sumiu e que a pessoa acabou de acionar. */
const unavailable = ref<string | null>(
  typeof route.query.aviso === "string" ? route.query.aviso : null,
);
const message = ref("");
const confirmClear = ref(false);
const cleared = ref(false);

const readCount = computed(() => notifications.value.length - unreadCount.value);

const tabs = computed(() => [
  { value: "todas" as const, label: "Todas", count: notifications.value.length },
  { value: "nao-lidas" as const, label: "Não lidas", count: unreadCount.value },
  { value: "lidas" as const, label: "Lidas", count: readCount.value },
]);

const shown = computed(() =>
  notifications.value.filter((item) =>
    tab.value === "todas" ? true : tab.value === "nao-lidas" ? item.unread : !item.unread,
  ),
);

/** Agrupados por dia recente e depois por mês, na ordem em que aparecem. */
const groups = computed(() => {
  const result: { label: string; items: AppNotification[] }[] = [];
  for (const item of shown.value) {
    const label = momentGroup(item.at);
    const group = result.find((entry) => entry.label === label);
    if (group) group.items.push(item);
    else result.push({ label, items: [item] });
  }
  return result;
});

const summary = computed(() => {
  const total = notifications.value.length;
  if (total === 0) return "Nenhuma notificação na listagem.";
  const unread = unreadCount.value;
  return `${total} ${total === 1 ? "notificação" : "notificações"}, ${unread} ${
    unread === 1 ? "não lida" : "não lidas"
  }. Mais recentes primeiro.`;
});

const empty = computed(() => {
  if (cleared.value && notifications.value.length === 0) {
    return {
      title: "Sua listagem está vazia",
      text: "Novas notificações aparecem aqui a cada mudança nas suas requisições. O e-mail continua sendo enviado mesmo com a lista limpa.",
    };
  }
  if (tab.value === "nao-lidas") {
    return {
      title: "Nada pendente de leitura",
      text: "Você já leu tudo. As notificações lidas seguem na aba “Todas”.",
    };
  }
  if (tab.value === "lidas") {
    return {
      title: "Nenhuma notificação lida ainda",
      text: "Assim que você abrir ou marcar uma notificação, ela aparece nesta aba.",
    };
  }
  return {
    title: "Nenhuma notificação ainda",
    text:
      role === "titular"
        ? "Quando você registrar uma requisição, o acompanhamento aparece aqui."
        : "Quando houver movimento na fila da organização, os avisos aparecem aqui.",
  };
});

const TONE_STRIPE: Record<NotificationTone, string> = {
  alerta: "border-l-danger",
  pendencia: "border-l-due-soon",
  neutro: "border-l-brand",
};

function open(item: AppNotification) {
  markAsRead(item.id);
  if (item.target) {
    void router.push(item.target);
    return;
  }
  unavailable.value = item.id;
}

function markAll() {
  markAllAsRead();
  message.value =
    "Todas as notificações foram marcadas como lidas. O contador do cabeçalho zerou.";
}

function confirmClearing() {
  clear();
  cleared.value = true;
  confirmClear.value = false;
  tab.value = "todas";
  message.value = "Listagem limpa. A ação ficou registrada no histórico desta conta.";
}
</script>

<template>
  <AppShell :role="role">
    <div class="mx-auto flex max-w-[1200px] flex-col gap-[22px]">
      <div
        class="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-8"
      >
        <div class="flex max-w-[680px] flex-col gap-2">
          <h1 class="font-serif text-[26px] font-semibold leading-[1.15] text-ink sm:text-[32px]">
            Notificações
          </h1>
          <p class="text-[15px] leading-relaxed text-ink-soft" aria-live="polite">
            {{ summary }}
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2.5">
          <BaseButton
            variant="secondary"
            size="sm"
            :disabled="unreadCount === 0"
            @click="markAll"
          >
            Marcar todas como lidas
          </BaseButton>
          <BaseButton
            variant="secondary"
            size="sm"
            :disabled="notifications.length === 0"
            @click="confirmClear = true"
          >
            Limpar listagem
          </BaseButton>
        </div>
      </div>

      <div
        v-if="message"
        role="status"
        class="flex flex-wrap items-center gap-4 border border-line-button bg-surface-muted py-4 pl-4 pr-5"
      >
        <span aria-hidden="true" class="w-[3px] self-stretch bg-brand" />
        <p class="flex-1 text-[15px] leading-normal text-ink-body">{{ message }}</p>
        <button
          type="button"
          class="py-1 text-sm text-brand underline hover:text-brand-strong"
          @click="message = ''"
        >
          Fechar
        </button>
      </div>

      <div role="tablist" aria-label="Filtrar notificações" class="flex gap-5 border-b border-line">
        <button
          v-for="item in tabs"
          :key="item.value"
          type="button"
          role="tab"
          :aria-selected="tab === item.value"
          class="-mb-px flex items-center gap-2 border-b-2 px-1 pb-[11px] pt-3 text-[15px]"
          :class="
            tab === item.value
              ? 'border-brand font-semibold text-ink'
              : 'border-transparent text-ink-soft hover:text-ink'
          "
          @click="tab = item.value"
        >
          {{ item.label }}
          <span
            class="px-[7px] py-0.5 font-label text-[13px] font-bold"
            :class="tab === item.value ? 'bg-brand text-white' : 'bg-track-bar text-ink-soft'"
          >
            {{ item.count }}
          </span>
        </button>
      </div>

      <section
        v-if="groups.length === 0"
        class="flex flex-col items-center gap-3 border border-line bg-surface-subtle px-6 py-14 text-center"
      >
        <h2 class="font-serif text-[22px] font-semibold text-ink">{{ empty.title }}</h2>
        <p class="max-w-[56ch] text-[15px] leading-relaxed text-ink-soft">{{ empty.text }}</p>
      </section>

      <div v-else class="flex flex-col gap-[26px]">
        <section v-for="group in groups" :key="group.label" class="flex flex-col gap-2.5">
          <h2 class="flex items-center gap-3">
            <span
              class="font-label text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-soft"
            >
              {{ group.label }}
            </span>
            <span aria-hidden="true" class="h-px flex-1 bg-line-soft" />
          </h2>

          <ul class="flex flex-col gap-px border border-line bg-line-soft">
            <li
              v-for="item in group.items"
              :key="item.id"
              class="grid grid-cols-[18px_minmax(0,1fr)] items-start gap-x-3.5 gap-y-3 border-l-4 px-4 py-5 sm:grid-cols-[26px_minmax(0,1fr)_auto] sm:gap-x-4 sm:px-[22px]"
              :class="[
                item.unread ? `bg-surface-muted ${TONE_STRIPE[item.tone]}` : 'border-l-line-soft bg-surface',
              ]"
            >
              <span
                aria-hidden="true"
                class="mt-[7px] size-2.5"
                :class="item.unread ? 'bg-brand' : 'bg-line'"
              />
              <div class="flex min-w-0 flex-col gap-[5px]">
                <p class="flex flex-wrap items-center gap-2.5">
                  <span
                    class="font-label text-[11px] font-semibold uppercase tracking-[0.06em]"
                    :class="
                      !item.unread
                        ? 'text-ink-faint'
                        : item.tone === 'alerta'
                          ? 'text-danger'
                          : 'text-brand'
                    "
                  >
                    {{ item.type }}
                  </span>
                  <span
                    v-if="!item.target"
                    class="bg-ink-faint px-[7px] py-[3px] font-label text-[11px] font-semibold uppercase tracking-[0.06em] text-white"
                  >
                    Recurso indisponível
                  </span>
                </p>
                <button
                  type="button"
                  class="text-left text-[17px] leading-snug text-ink underline decoration-line-button underline-offset-[3px] hover:decoration-brand"
                  :class="item.unread ? 'font-semibold' : ''"
                  @click="open(item)"
                >
                  {{ item.title }}
                  <span v-if="item.unread" class="sr-only">(não lida)</span>
                </button>
                <p class="text-[15px] leading-relaxed text-ink-soft">{{ item.detail }}</p>
                <p class="mt-0.5 flex flex-wrap gap-x-3.5 text-sm text-ink-faint">
                  <time :datetime="item.at">{{ relativeMoment(item.at) }}</time>
                  <span v-if="item.reference">{{ item.reference }}</span>
                </p>
                <div
                  v-if="unavailable === item.id && item.unavailableReason"
                  role="status"
                  class="mt-2.5 flex flex-col gap-[3px] border-l-[3px] border-due-soon bg-due-soon-wash px-4 py-3.5"
                >
                  <p class="text-[15px] font-semibold text-ink">
                    Este recurso não está mais disponível
                  </p>
                  <p class="text-sm leading-relaxed text-ink-body">{{ item.unavailableReason }}</p>
                </div>
              </div>
              <div class="col-start-2 sm:col-start-auto">
                <BaseButton
                  v-if="item.unread"
                  variant="secondary"
                  size="sm"
                  class="whitespace-nowrap"
                  @click="markAsRead(item.id)"
                >
                  Marcar como lida
                </BaseButton>
                <p v-else class="px-1 text-sm text-ink-faint">Lida</p>
              </div>
            </li>
          </ul>
        </section>
      </div>
    </div>

    <BaseDialog v-model:open="confirmClear" title="Limpar a listagem de notificações?" width="sm">
      <p class="text-[15px] leading-relaxed text-ink-body">
        As {{ notifications.length }} notificações saem da sua listagem, inclusive as
        {{ unreadCount }} não lidas. A ação não pode ser desfeita.
      </p>
      <p class="border-l-[3px] border-ink-muted bg-surface-muted px-4 py-3.5 text-sm leading-relaxed">
        As requisições e o histórico de atendimento não são afetados. A limpeza vale só para esta
        conta e fica registrada em auditoria.
      </p>
      <template #actions>
        <BaseButton variant="secondary" @click="confirmClear = false">
          Manter as notificações
        </BaseButton>
        <BaseButton variant="danger" @click="confirmClearing">Limpar listagem</BaseButton>
      </template>
    </BaseDialog>
  </AppShell>
</template>
