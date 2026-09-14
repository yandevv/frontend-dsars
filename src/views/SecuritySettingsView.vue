<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import BaseButton from "@/shared/ui/BaseButton.vue";
import BaseDialog from "@/shared/ui/BaseDialog.vue";
import BaseField from "@/shared/ui/BaseField.vue";
import PasswordStrengthMeter from "@/features/auth/components/PasswordStrengthMeter.vue";
import SettingsLayout from "@/features/settings/components/SettingsLayout.vue";
import {
  changePassword,
  endOtherSessions,
  endSession,
  fetchSecurity,
} from "@/features/settings/services/securityService";
import { currentRole } from "@/features/auth/composables/useSession";
import { messageOf } from "@/shared/api/ApiError";
import { formatDate, relativeMoment } from "@/shared/utils/date";
import { usePasswordPolicy } from "@/features/auth/composables/usePasswordPolicy";
import type { AccountSession, SecurityOverview } from "@/features/settings/types/security";

/**
 * Turno 1 · Tela 18 — Segurança (RF018 / RF019).
 *
 * A data da última troca de senha e todos os aparelhos conectados. Trocar a
 * senha pede a atual e encerra as outras sessões; encerrar uma sessão é
 * imediato e não exige trocar a senha — mas a tela recomenda, se o acesso não
 * for reconhecido.
 */
const role = currentRole();

const security = ref<SecurityOverview | null>(null);
const notice = ref("");
const loadError = ref("");

onMounted(async () => {
  try {
    security.value = await fetchSecurity();
  } catch (error) {
    loadError.value = messageOf(error);
  }
});

/** Conta criada pelo Google: a primeira senha dispensa a atual. */
const needsCurrent = computed(() => security.value?.passwordSet ?? true);

const others = computed(() => security.value?.sessions.filter((session) => !session.current) ?? []);

const sessionsSummary = computed(() => {
  const total = security.value?.sessions.length ?? 0;
  return `${total} ${total === 1 ? "dispositivo conectado" : "dispositivos conectados"}`;
});

function lastSeen(session: AccountSession): string {
  return session.current ? "Ativa agora" : `Último acesso: ${relativeMoment(session.lastSeenAt)}`;
}

// ── Troca de senha ───────────────────────────────────────────────────────────
const passwordOpen = ref(false);
const saving = ref(false);
const attempted = ref(false);
const form = ref({ current: "", next: "", repeat: "" });
const refusal = ref("");

const policy = usePasswordPolicy(() => form.value.next);

const currentError = computed(() => {
  if (refusal.value) return refusal.value;
  if (attempted.value && needsCurrent.value && !form.value.current) {
    return "Informe a senha atual para continuar.";
  }
  return undefined;
});

const repeatError = computed(() =>
  attempted.value && form.value.repeat !== form.value.next
    ? "As duas senhas não coincidem."
    : undefined,
);

function openPasswordDialog() {
  form.value = { current: "", next: "", repeat: "" };
  attempted.value = false;
  refusal.value = "";
  notice.value = "";
  passwordOpen.value = true;
}

async function savePassword() {
  if (saving.value) return;
  attempted.value = true;
  refusal.value = "";
  if (
    (needsCurrent.value && !form.value.current) ||
    !policy.isValid.value ||
    form.value.repeat !== form.value.next
  ) {
    return;
  }

  saving.value = true;
  try {
    const result = await changePassword({
      current: form.value.current,
      next: form.value.next,
    });
    security.value = result;
    passwordOpen.value = false;
    notice.value =
      result.endedSessions > 0
        ? `Senha alterada e ${result.endedSessions} ${result.endedSessions === 1 ? "sessão encerrada" : "sessões encerradas"}. Um aviso foi enviado ao seu e-mail.`
        : "Senha alterada. Um aviso foi enviado ao seu e-mail.";
  } catch (error) {
    refusal.value = messageOf(error);
  } finally {
    saving.value = false;
  }
}

// ── Sessões ──────────────────────────────────────────────────────────────────
const confirmEndAll = ref(false);
const endingAll = ref(false);

async function endOne(session: AccountSession) {
  try {
    security.value = await endSession(session.id);
    notice.value = `Sessão em ${session.device} encerrada.`;
  } catch (error) {
    notice.value = messageOf(error);
  }
}

async function endAll() {
  endingAll.value = true;
  try {
    const result = await endOtherSessions();
    security.value = result;
    confirmEndAll.value = false;
    notice.value = `${result.endedSessions} ${result.endedSessions === 1 ? "sessão encerrada" : "sessões encerradas"}. Esta sessão continua ativa.`;
  } finally {
    endingAll.value = false;
  }
}
</script>

<template>
  <SettingsLayout
    :role="role"
    section="seguranca"
    title="Segurança"
    subtitle="Última alteração de senha e dispositivos conectados. Trocar a senha encerra as demais sessões."
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
    <p v-else-if="!security" role="status" class="text-[15px] text-ink-soft">
      Carregando a segurança da conta…
    </p>

    <template v-else>
      <section
        class="flex flex-wrap items-start justify-between gap-6 border border-line px-5 py-[22px] sm:px-[22px]"
        aria-labelledby="titulo-senha"
      >
        <div class="flex min-w-0 flex-col gap-[5px]">
          <p class="font-label text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-soft">
            Senha
          </p>
          <h2 id="titulo-senha" class="font-serif text-[21px] font-semibold text-ink">
            {{
              security.passwordChangedAt
                ? `Alterada em ${formatDate(security.passwordChangedAt)}`
                : security.passwordSet
                  ? "Definida no cadastro"
                  : "Nenhuma senha definida"
            }}
          </h2>
          <p class="max-w-[76ch] text-[15px] leading-relaxed text-ink-soft">
            A alteração exige a senha atual e encerra todas as outras sessões — só o dispositivo em
            que você fizer a troca continua conectado.
          </p>
        </div>
        <BaseButton size="sm" @click="openPasswordDialog">Alterar senha</BaseButton>
      </section>

      <section class="border border-line" aria-labelledby="titulo-sessoes">
        <div
          class="flex flex-wrap items-center justify-between gap-4 border-b border-line px-5 py-4 sm:px-[22px]"
        >
          <div class="flex flex-wrap items-baseline gap-3">
            <h2 id="titulo-sessoes" class="font-serif text-xl font-semibold text-ink">
              Sessões ativas
            </h2>
            <p class="text-sm text-ink-muted">{{ sessionsSummary }}</p>
          </div>
          <BaseButton
            size="sm"
            variant="secondary"
            :disabled="others.length === 0"
            @click="confirmEndAll = true"
          >
            Encerrar as outras sessões
          </BaseButton>
        </div>

        <ul>
          <li
            v-for="session in security.sessions"
            :key="session.id"
            class="grid gap-3 border-b border-line-soft px-5 py-[18px] sm:px-[22px] md:grid-cols-[minmax(0,1fr)_260px_auto] md:items-center md:gap-5"
            :class="session.current ? 'bg-surface-muted' : 'bg-surface'"
          >
            <div class="flex min-w-0 flex-col gap-1">
              <p class="flex flex-wrap items-center gap-2.5">
                <span class="text-base font-semibold text-ink">{{ session.device }}</span>
                <span
                  v-if="session.current"
                  class="bg-brand px-2 py-1 font-label text-[11px] font-semibold uppercase tracking-[0.06em] text-white"
                >
                  Esta sessão
                </span>
              </p>
              <p class="text-sm leading-normal text-ink-soft">{{ session.origin }}</p>
            </div>
            <div class="flex flex-col gap-[3px]">
              <p class="text-[15px] text-ink">
                Início: {{ relativeMoment(session.startedAt) }}
              </p>
              <p class="text-[13px] text-ink-faint">{{ lastSeen(session) }}</p>
            </div>
            <div class="flex items-center md:justify-end">
              <button
                v-if="!session.current"
                type="button"
                class="h-11 whitespace-nowrap border border-danger-line bg-surface px-4 text-sm font-medium text-danger hover:border-danger"
                @click="endOne(session)"
              >
                Encerrar<span class="sr-only"> a sessão em {{ session.device }}</span>
              </button>
              <p v-else class="whitespace-nowrap text-sm text-ink-faint">Em uso agora</p>
            </div>
          </li>
        </ul>

        <p class="flex gap-3 px-5 py-[18px] text-sm leading-relaxed text-ink-soft sm:px-[22px]">
          <span aria-hidden="true" class="w-[3px] shrink-0 self-stretch bg-field-disabled-line" />
          A origem vem do endereço IP no momento do acesso e pode indicar a cidade errada em redes
          móveis. Se não reconhecer uma sessão, encerre-a e troque a senha em seguida.
        </p>
      </section>
    </template>

    <BaseDialog v-model:open="passwordOpen" title="Alterar senha" width="sm" :locked="saving">
      <p class="text-[15px] leading-relaxed text-ink-body">
        <template v-if="others.length > 0">
          Ao salvar, as outras {{ others.length }}
          {{ others.length === 1 ? "sessão ativa é encerrada" : "sessões ativas são encerradas" }}
          e você recebe um aviso por e-mail.
        </template>
        <template v-else>Ao salvar, você recebe um aviso por e-mail.</template>
      </p>
      <form class="flex flex-col gap-4" novalidate @submit.prevent="savePassword">
        <BaseField
          v-if="needsCurrent"
          v-model="form.current"
          label="Senha atual"
          type="password"
          autocomplete="current-password"
          :error="currentError"
          :disabled="saving"
        />
        <BaseField
          v-model="form.next"
          label="Nova senha"
          type="password"
          autocomplete="new-password"
          :error="
            !needsCurrent && refusal
              ? refusal
              : undefined
          "
          :disabled="saving"
        />
        <PasswordStrengthMeter
          :checks="policy.checks.value"
          :strength="policy.strength.value"
          :invalid="attempted && !policy.isValid.value"
        />
        <BaseField
          v-model="form.repeat"
          label="Repetir a nova senha"
          type="password"
          autocomplete="new-password"
          :error="repeatError"
          :disabled="saving"
        />
        <!-- Enter em qualquer campo envia; o botão visível fica no rodapé. -->
        <button type="submit" class="sr-only" tabindex="-1">Salvar</button>
      </form>
      <template #note>A troca fica registrada no histórico de segurança da conta.</template>
      <template #actions>
        <BaseButton variant="secondary" :disabled="saving" @click="passwordOpen = false">
          Cancelar
        </BaseButton>
        <BaseButton :busy="saving" @click="savePassword">
          {{ saving ? "Salvando…" : "Salvar e encerrar sessões" }}
        </BaseButton>
      </template>
    </BaseDialog>

    <BaseDialog
      v-model:open="confirmEndAll"
      title="Encerrar as outras sessões?"
      tone="danger"
      width="sm"
      :locked="endingAll"
    >
      <p class="text-[15px] leading-relaxed text-ink-body">
        {{ others.length }}
        {{ others.length === 1 ? "sessão será desconectada" : "sessões serão desconectadas" }} na
        próxima ação no portal. Esta sessão continua ativa. Não é preciso trocar a senha, mas
        recomendamos trocar se você não reconhece algum acesso.
      </p>
      <template #actions>
        <BaseButton variant="secondary" :disabled="endingAll" @click="confirmEndAll = false">
          Manter conectadas
        </BaseButton>
        <BaseButton variant="danger" :busy="endingAll" @click="endAll">Encerrar sessões</BaseButton>
      </template>
    </BaseDialog>
  </SettingsLayout>
</template>
