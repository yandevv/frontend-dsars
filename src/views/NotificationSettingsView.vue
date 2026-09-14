<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { onBeforeRouteLeave } from "vue-router";

import BaseButton from "@/shared/ui/BaseButton.vue";
import BaseDialog from "@/shared/ui/BaseDialog.vue";
import BaseSwitch from "@/shared/ui/BaseSwitch.vue";
import SettingsLayout from "@/features/settings/components/SettingsLayout.vue";
import { NOTIFICATION_CHANNELS } from "@/features/settings/constants/notificationEvents";
import {
  clonePreferences,
  defaultPreferences,
  fetchPreferences,
  savePreferences,
} from "@/features/settings/services/notificationPreferencesService";
import { currentRole } from "@/features/auth/composables/useSession";
import { messageOf } from "@/shared/api/ApiError";
import type {
  NotificationChannel,
  NotificationPreferences,
  PreferenceEvent,
} from "@/features/settings/types/preferences";

/**
 * Turno 1 · Tela 19 — Preferências de notificação (RF020 / RF021).
 *
 * Uma matriz de evento por canal. Cada canal liga e desliga independente dos
 * outros; as comunicações obrigatórias — transição de estado e segurança da
 * conta — aparecem travadas em vez de sumirem, para a pessoa saber que aquele
 * aviso sempre chegará. Nada muda até salvar, e salvar pede confirmação.
 */
const role = currentRole();

const events = ref<PreferenceEvent[]>([]);
const saved = ref<NotificationPreferences | null>(null);
const draft = ref<NotificationPreferences | null>(null);
const notice = ref("");
const loadError = ref("");
const saveError = ref("");
const confirmSave = ref(false);
const saving = ref(false);

onMounted(async () => {
  try {
    const matrix = await fetchPreferences();
    events.value = matrix.events;
    saved.value = matrix.preferences;
    draft.value = clonePreferences(matrix.preferences);
  } catch (error) {
    loadError.value = messageOf(error);
  }
});

function supports(event: PreferenceEvent, channel: NotificationChannel): boolean {
  return event.channels[channel] !== undefined;
}

function isLocked(event: PreferenceEvent, channel: NotificationChannel): boolean {
  return event.channels[channel]?.mandatory ?? false;
}

function hasMandatory(event: PreferenceEvent): boolean {
  return Object.values(event.channels).some((setting) => setting.mandatory);
}

/** Quantas células mudaram desde o último salvamento. */
const changes = computed(() => {
  if (!saved.value || !draft.value) return 0;
  let total = 0;
  for (const event of events.value) {
    for (const channel of NOTIFICATION_CHANNELS) {
      if (!supports(event, channel.id)) continue;
      if (saved.value[event.id]?.[channel.id] !== draft.value[event.id]?.[channel.id]) total += 1;
    }
  }
  return total;
});

const onCount = computed(() => {
  if (!draft.value) return 0;
  return events.value.reduce(
    (sum, event) =>
      sum +
      NOTIFICATION_CHANNELS.filter(
        (channel) =>
          supports(event, channel.id) &&
          !isLocked(event, channel.id) &&
          draft.value?.[event.id]?.[channel.id],
      ).length,
    0,
  );
});

const optionalCount = computed(() =>
  events.value.reduce(
    (sum, event) =>
      sum +
      NOTIFICATION_CHANNELS.filter(
        (channel) => supports(event, channel.id) && !isLocked(event, channel.id),
      ).length,
    0,
  ),
);

const summary = computed(() => {
  if (changes.value > 0) {
    return `${changes.value} ${changes.value === 1 ? "alteração ainda não salva" : "alterações ainda não salvas"}.`;
  }
  return `${onCount.value} de ${optionalCount.value} avisos opcionais ligados. As linhas obrigatórias não entram na conta.`;
});

function restoreDefaults() {
  draft.value = defaultPreferences(events.value);
  notice.value = "Padrão do portal aplicado à matriz. Salve para que passe a valer.";
}

async function save() {
  if (!draft.value || saving.value) return;
  saving.value = true;
  saveError.value = "";
  try {
    const matrix = await savePreferences(events.value, draft.value);
    events.value = matrix.events;
    saved.value = matrix.preferences;
    draft.value = clonePreferences(matrix.preferences);
    confirmSave.value = false;
    notice.value = "Preferências de notificação salvas. A alteração ficou registrada no histórico da conta.";
  } catch (error) {
    saveError.value = messageOf(error);
  } finally {
    saving.value = false;
  }
}

// Sair com mudanças não salvas perderia o que foi feito sem aviso.
onBeforeRouteLeave(() => {
  if (changes.value === 0) return true;
  return window.confirm("Há alterações nas preferências que ainda não foram salvas. Sair assim mesmo?");
});
</script>

<template>
  <SettingsLayout
    :role="role"
    section="notificacoes"
    title="Notificações"
    subtitle="Escolha por onde receber cada aviso. Transição de estado e segurança da conta são obrigatórias e aparecem travadas."
  >
    <div
      v-if="notice"
      role="status"
      class="flex flex-wrap items-center gap-3.5 border border-line-button bg-surface-muted py-4 pl-4 pr-5"
    >
      <span aria-hidden="true" class="w-[3px] self-stretch bg-brand" />
      <p class="flex-1 text-[15px] leading-normal text-ink-body">{{ notice }}</p>
      <button
        type="button"
        class="py-1 text-sm text-brand underline hover:text-brand-strong"
        @click="notice = ''"
      >
        Fechar
      </button>
    </div>

    <p v-if="loadError" role="alert" class="text-[15px] text-danger">{{ loadError }}</p>
    <p v-else-if="!draft" role="status" class="text-[15px] text-ink-soft">
      Carregando suas preferências…
    </p>

    <template v-else>
      <section class="border border-line" aria-label="Avisos por canal">
        <!-- Cabeçalho da matriz: só no computador, onde as colunas cabem. -->
        <div
          class="hidden border-b border-line bg-surface-muted md:grid md:grid-cols-[minmax(0,1fr)_repeat(2,140px)]"
          aria-hidden="true"
        >
          <div class="flex flex-col gap-0.5 px-[22px] py-4">
            <span class="font-serif text-xl font-semibold text-ink">Evento</span>
            <span class="text-[13px] text-ink-muted">Ajuste por canal</span>
          </div>
          <div
            v-for="channel in NOTIFICATION_CHANNELS"
            :key="channel.id"
            class="flex flex-col items-center gap-0.5 border-l border-line-soft px-3.5 py-4 text-center"
          >
            <span class="text-[15px] font-semibold text-ink">{{ channel.label }}</span>
            <span class="text-[13px] leading-snug text-ink-muted">{{ channel.note }}</span>
          </div>
        </div>

        <ul>
          <li
            v-for="event in events"
            :key="event.id"
            class="grid border-b border-line-soft md:grid-cols-[minmax(0,1fr)_repeat(2,140px)]"
            :class="hasMandatory(event) ? 'bg-surface-subtle' : 'bg-surface'"
          >
            <div class="flex min-w-0 flex-col gap-1 px-5 pb-3 pt-[18px] md:px-[22px] md:pb-[18px]">
              <p class="flex flex-wrap items-center gap-2.5">
                <span class="text-base font-semibold text-ink">{{ event.label }}</span>
                <span
                  v-if="hasMandatory(event)"
                  class="bg-ink-muted px-2 py-1 font-label text-[11px] font-semibold uppercase tracking-[0.06em] text-white"
                >
                  Obrigatória
                </span>
              </p>
              <p class="text-sm leading-relaxed text-ink-soft">{{ event.description }}</p>
            </div>

            <div class="grid grid-cols-2 gap-2 px-5 pb-[18px] md:contents">
              <div
                v-for="channel in NOTIFICATION_CHANNELS"
                :key="channel.id"
                class="flex flex-col items-center justify-center gap-1.5 md:border-l md:border-line-soft md:px-3.5 md:py-[18px]"
              >
                <!-- No celular o nome do canal vai junto de cada interruptor. -->
                <span class="text-[13px] font-semibold text-ink-soft md:hidden">
                  {{ channel.label }}
                </span>
                <BaseSwitch
                  v-if="supports(event, channel.id) && draft[event.id]"
                  v-model="draft[event.id]![channel.id]!"
                  :label="`${channel.label} para ${event.label}`"
                  :locked="isLocked(event, channel.id)"
                />
                <span v-else class="text-sm text-ink-faint">
                  Não se aplica<span class="sr-only"> a {{ event.label }}</span>
                </span>
              </div>
            </div>
          </li>
        </ul>

        <p class="flex gap-3 px-5 py-[18px] text-sm leading-relaxed text-ink-soft md:px-[22px]">
          <span aria-hidden="true" class="w-[3px] shrink-0 self-stretch bg-field-disabled-line" />
          <span>
            As linhas obrigatórias ficam travadas: transições de estado da requisição e segurança da
            conta são comunicações legais e de proteção, por isso aparecem visíveis e sem controle
            em vez de desaparecerem da matriz.
          </span>
        </p>
      </section>

      <div class="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p class="text-sm text-ink-muted" aria-live="polite">{{ summary }}</p>
        <div class="flex flex-col-reverse gap-2.5 sm:flex-row sm:flex-wrap">
          <BaseButton variant="secondary" size="sm" @click="restoreDefaults">
            Restaurar padrão
          </BaseButton>
          <BaseButton size="sm" :disabled="changes === 0" @click="confirmSave = true">
            Salvar preferências
          </BaseButton>
        </div>
      </div>
    </template>

    <BaseDialog
      v-model:open="confirmSave"
      title="Salvar as preferências de notificação?"
      width="sm"
      :locked="saving"
    >
      <p class="text-[15px] leading-relaxed text-ink-body">
        {{ changes }} {{ changes === 1 ? "canal muda" : "canais mudam" }} de estado. Os avisos
        passam a chegar pelos canais marcados a partir de agora; as comunicações obrigatórias
        continuam saindo.
      </p>
      <p v-if="saveError" class="text-[13px] text-danger" role="alert">{{ saveError }}</p>
      <template #note>A alteração fica registrada no histórico da conta.</template>
      <template #actions>
        <BaseButton variant="secondary" :disabled="saving" @click="confirmSave = false">
          Continuar ajustando
        </BaseButton>
        <BaseButton :busy="saving" @click="save">
          {{ saving ? "Salvando…" : "Salvar preferências" }}
        </BaseButton>
      </template>
    </BaseDialog>
  </SettingsLayout>
</template>
