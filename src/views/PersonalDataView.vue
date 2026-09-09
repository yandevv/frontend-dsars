<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import BaseButton from "@/shared/ui/BaseButton.vue";
import BaseDialog from "@/shared/ui/BaseDialog.vue";
import SettingsLayout from "@/features/settings/components/SettingsLayout.vue";
import {
  ProfileError,
  cancelEmailChange,
  fetchProfile,
  requestEmailChange,
  updateProfile,
  type ProfileRefusal,
} from "@/features/settings/services/accountSettingsService";
import { REVEAL_SECONDS, useReveal } from "@/features/settings/composables/useReveal";
import { currentRole, useSession } from "@/features/auth/composables/useSession";
import { maskDocument, maskPhone } from "@/features/settings/utils/mask";
import type { AccountProfile, EditableField } from "@/features/settings/types/profile";

/**
 * Turno 1 · Tela 17 — Dados pessoais (RF016 / RF017).
 *
 * Documento e telefone chegam mascarados; revelar é um clique e dura meio
 * minuto. Editar também é explícito, e só vale depois da confirmação — a troca
 * de e-mail ainda depende do link enviado ao novo endereço.
 */
const role = currentRole();
const { account } = useSession(role);

const profile = ref<AccountProfile | null>(null);
const reveal = useReveal();

onMounted(async () => {
  profile.value = await fetchProfile(account.value.email);
});

type Notice = { text: string; tone: "ok" | "atencao" };
const notice = ref<Notice | null>(null);

// ── Campos ───────────────────────────────────────────────────────────────────
interface FieldRow {
  key: EditableField | "document";
  label: string;
  note: string;
  help?: string;
  value: string;
  masked: boolean;
  editable: boolean;
  badge?: { text: string; tone: "ok" | "pendente" };
}

const fields = computed<FieldRow[]>(() => {
  const current = profile.value;
  if (!current) return [];
  return [
    {
      key: "name",
      label: "Nome completo",
      note: "Como aparece nas requisições registradas.",
      help: "Use o nome civil completo, como no documento de identificação.",
      value: current.name,
      masked: false,
      editable: true,
    },
    {
      key: "email",
      label: "E-mail",
      note: "Serve de login e de endereço dos avisos.",
      help: "A troca só vale depois que você confirmar o novo endereço.",
      value: current.email,
      masked: false,
      editable: !current.pendingEmail,
      badge: current.pendingEmail
        ? { text: "Troca pendente", tone: "pendente" }
        : { text: "Verificado", tone: "ok" },
    },
    {
      key: "document",
      label: "Documento de identificação",
      note: "CPF usado na comprovação de identidade.",
      value: reveal.isRevealed("document") ? current.document : maskDocument(current.document),
      masked: true,
      editable: false,
      badge: { text: "Verificado", tone: "ok" },
    },
    {
      key: "phone",
      label: "Telefone",
      note: "Usado só para contato sobre requisições.",
      help: "Informe DDD e número. Sem telefone, o canal SMS fica indisponível.",
      value: reveal.isRevealed("phone") ? current.phone : maskPhone(current.phone),
      masked: true,
      editable: true,
    },
  ];
});

const editing = ref<EditableField | null>(null);
const draft = ref("");
const draftError = ref("");

function startEdit(key: EditableField) {
  const current = profile.value;
  if (!current) return;
  editing.value = key;
  // O telefone entra no campo sem máscara: editar é também ver o dado.
  draft.value = key === "name" ? current.name : key === "email" ? "" : current.phone;
  draftError.value = "";
  notice.value = null;
}

function stopEdit() {
  editing.value = null;
  draft.value = "";
  draftError.value = "";
}

// ── Confirmação ──────────────────────────────────────────────────────────────
const confirming = ref(false);
const saving = ref(false);
const password = ref("");
const passwordError = ref("");

const REFUSALS: Record<ProfileRefusal, string> = {
  "nome-invalido": "Escreva o nome completo, com pelo menos nome e sobrenome.",
  "email-invalido": "Confira o endereço: ele precisa ter o formato nome@provedor.com.",
  "email-igual": "Este já é o e-mail da conta.",
  "telefone-invalido": "Informe o DDD e o número, com 10 ou 11 dígitos.",
  "senha-incorreta": "A senha não confere. Tente de novo.",
  "sem-troca-pendente": "Não há troca de e-mail pendente.",
};

const CONFIRM_TEXT: Record<EditableField, { title: string; text: string; action: string }> = {
  name: {
    title: "Confirmar alteração do nome",
    text: "O nome passa a constar nas próximas requisições. As já registradas mantêm o nome vigente no momento do registro.",
    action: "Salvar alteração",
  },
  email: {
    title: "Confirmar troca de e-mail",
    text: "O novo endereço fica pendente até você clicar no link que enviaremos. Até lá, o acesso e os avisos continuam no e-mail atual.",
    action: "Enviar confirmação",
  },
  phone: {
    title: "Confirmar alteração do telefone",
    text: "O telefone é usado apenas para contato sobre requisições e para o canal SMS, se estiver ligado.",
    action: "Salvar alteração",
  },
};

const oldValue = computed(() => {
  const current = profile.value;
  if (!current || !editing.value) return "";
  return editing.value === "name"
    ? current.name
    : editing.value === "email"
      ? current.email
      : current.phone;
});

function askConfirmation() {
  if (!editing.value) return;
  if (draft.value.trim() === "") {
    draftError.value = "Preencha o campo ou cancele a edição.";
    return;
  }
  if (draft.value.trim() === oldValue.value) {
    draftError.value = "O valor novo é igual ao atual.";
    return;
  }
  draftError.value = "";
  password.value = "";
  passwordError.value = "";
  confirming.value = true;
}

async function confirm() {
  const current = profile.value;
  const field = editing.value;
  if (!current || !field || saving.value) return;

  saving.value = true;
  try {
    if (field === "email") {
      profile.value = await requestEmailChange(current.email, {
        newEmail: draft.value,
        password: password.value,
      });
      notice.value = {
        text: `Troca de e-mail registrada. Enviamos um link de confirmação para ${profile.value.pendingEmail}; o endereço atual continua valendo até lá.`,
        tone: "atencao",
      };
    } else {
      profile.value = await updateProfile(current.email, field, draft.value);
      notice.value = {
        text: `${field === "name" ? "Nome" : "Telefone"} atualizado. A alteração foi registrada no histórico da conta.`,
        tone: "ok",
      };
    }
    confirming.value = false;
    stopEdit();
  } catch (error) {
    if (!(error instanceof ProfileError)) throw error;
    if (error.refusal === "senha-incorreta") {
      passwordError.value = REFUSALS[error.refusal];
    } else {
      confirming.value = false;
      draftError.value = REFUSALS[error.refusal];
    }
  } finally {
    saving.value = false;
  }
}

async function cancelChange() {
  const current = profile.value;
  if (!current) return;
  profile.value = await cancelEmailChange(current.email);
  notice.value = {
    text: `Troca de e-mail cancelada. O endereço ${current.email} continua sendo o da conta.`,
    tone: "ok",
  };
}
</script>

<template>
  <SettingsLayout
    :role="role"
    section="dados"
    title="Dados pessoais"
    subtitle="Documento e telefone aparecem mascarados. Revelar e editar são ações explícitas, e a troca de e-mail exige confirmação no novo endereço."
  >
    <div
      v-if="notice"
      role="status"
      class="flex flex-wrap items-center gap-3.5 border py-4 pl-4 pr-5"
      :class="notice.tone === 'ok' ? 'border-line-button bg-surface-muted' : 'border-pending-line bg-due-soon-wash'"
    >
      <span
        aria-hidden="true"
        class="w-[3px] self-stretch"
        :class="notice.tone === 'ok' ? 'bg-brand' : 'bg-due-soon'"
      />
      <p class="flex-1 text-[15px] leading-normal text-ink-body">{{ notice.text }}</p>
      <button
        type="button"
        class="py-1 text-sm text-brand underline hover:text-brand-strong"
        @click="notice = null"
      >
        Fechar
      </button>
    </div>

    <p v-if="!profile" role="status" class="text-[15px] text-ink-soft">Carregando seus dados…</p>

    <template v-else>
      <!-- Troca de e-mail aguardando o link do novo endereço. -->
      <section
        v-if="profile.pendingEmail"
        class="flex flex-wrap items-start gap-[18px] border-l-[3px] border-due-soon bg-due-soon-wash px-5 py-[18px]"
      >
        <div class="flex min-w-0 flex-1 flex-col gap-1">
          <h2 class="text-base font-semibold text-ink">
            Confirme o novo e-mail para concluir a troca
          </h2>
          <p class="text-sm leading-relaxed text-ink-body">
            Enviamos um link para <strong class="break-all">{{ profile.pendingEmail }}</strong>.
            Até a confirmação, o acesso e os avisos continuam em
            <strong class="break-all">{{ profile.email }}</strong>. O link vale 24 horas.
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2.5">
          <BaseButton
            size="sm"
            variant="secondary"
            :to="{
              name: 'email-confirmation',
              query: { origem: 'troca', email: profile.pendingEmail },
            }"
          >
            Reenviar link
          </BaseButton>
          <button
            type="button"
            class="px-1.5 text-[15px] font-medium text-brand underline hover:text-brand-strong"
            @click="cancelChange"
          >
            Cancelar troca
          </button>
        </div>
      </section>

      <section class="border border-line" aria-labelledby="titulo-dados-conta">
        <div
          class="flex flex-wrap items-baseline justify-between gap-4 border-b border-line px-5 py-4 sm:px-[22px]"
        >
          <h2 id="titulo-dados-conta" class="font-serif text-xl font-semibold text-ink">
            Dados da conta
          </h2>
          <p class="text-sm text-ink-muted">Identificação mascarada por padrão</p>
        </div>

        <dl>
          <div
            v-for="field in fields"
            :key="field.key"
            class="grid gap-3 border-b border-line-soft px-5 py-5 sm:px-[22px] md:grid-cols-[232px_minmax(0,1fr)_auto] md:items-start md:gap-5"
          >
            <dt class="flex flex-col gap-[3px]">
              <span class="text-[15px] font-semibold text-ink">{{ field.label }}</span>
              <span class="text-[13px] leading-snug text-ink-muted">{{ field.note }}</span>
            </dt>

            <dd class="flex min-w-0 flex-col gap-2">
              <div v-if="editing === field.key" class="flex max-w-[420px] flex-col gap-2.5">
                <label :for="`campo-${field.key}`" class="sr-only">Novo {{ field.label }}</label>
                <input
                  :id="`campo-${field.key}`"
                  v-model="draft"
                  :type="field.key === 'email' ? 'email' : field.key === 'phone' ? 'tel' : 'text'"
                  :autocomplete="field.key === 'email' ? 'email' : field.key === 'phone' ? 'tel' : 'name'"
                  :placeholder="field.key === 'email' ? 'novo@exemplo.com.br' : undefined"
                  :aria-invalid="draftError ? 'true' : undefined"
                  class="h-[46px] w-full border bg-surface px-3 text-base text-ink focus:outline-none focus:ring-2 focus:ring-brand"
                  :class="draftError ? 'border-2 border-danger' : 'border-brand'"
                  @keydown.enter.prevent="askConfirmation"
                  @keydown.esc="stopEdit"
                />
                <p
                  class="text-sm leading-normal"
                  :class="draftError ? 'text-danger' : 'text-ink-soft'"
                  aria-live="polite"
                >
                  {{ draftError || field.help }}
                </p>
              </div>

              <div v-else class="flex flex-wrap items-center gap-3.5">
                <span
                  class="break-all text-[17px] text-ink"
                  :class="field.masked ? 'font-label tracking-[0.04em]' : ''"
                >
                  {{ field.value || "Não informado" }}
                </span>
                <button
                  v-if="field.masked && field.value"
                  type="button"
                  class="py-1.5 text-sm font-medium text-brand underline hover:text-brand-strong"
                  :aria-label="
                    reveal.isRevealed(field.key)
                      ? `Ocultar ${field.label.toLowerCase()}`
                      : `Revelar ${field.label.toLowerCase()} por ${REVEAL_SECONDS} segundos`
                  "
                  @click="reveal.toggle(field.key)"
                >
                  {{ reveal.isRevealed(field.key) ? "Ocultar" : "Revelar" }}
                </button>
                <span
                  v-if="field.badge"
                  class="px-2 py-1 font-label text-[11px] font-semibold uppercase tracking-[0.06em]"
                  :class="
                    field.badge.tone === 'ok'
                      ? 'bg-brand-wash text-brand'
                      : 'bg-due-soon-wash text-due-soon-ink'
                  "
                >
                  {{ field.badge.text }}
                </span>
              </div>
            </dd>

            <div class="flex items-center gap-2.5">
              <template v-if="editing === field.key">
                <BaseButton size="sm" variant="secondary" @click="stopEdit">Cancelar</BaseButton>
                <BaseButton size="sm" @click="askConfirmation">Salvar</BaseButton>
              </template>
              <BaseButton
                v-else-if="field.editable && field.key !== 'document'"
                size="sm"
                variant="secondary"
                @click="startEdit(field.key as EditableField)"
              >
                Editar<span class="sr-only"> {{ field.label.toLowerCase() }}</span>
              </BaseButton>
              <p v-else-if="field.key === 'document'" class="whitespace-nowrap text-sm text-ink-faint">
                Somente leitura
              </p>
            </div>
          </div>
        </dl>

        <p class="flex gap-3 px-5 py-[18px] text-sm leading-relaxed text-ink-soft sm:px-[22px]">
          <span aria-hidden="true" class="w-[3px] shrink-0 self-stretch bg-field-disabled-line" />
          <span>
            O CPF já verificado não pode ser alterado por aqui: ele sustenta a comprovação de
            identidade das requisições registradas. Para corrigir um documento errado,
            <RouterLink
              v-if="role === 'titular'"
              :to="{ name: 'new-request' }"
              class="text-brand underline"
              >abra uma requisição de correção</RouterLink
            ><template v-else>abra uma requisição de correção</template> — o pedido passa pela
            equipe de proteção de dados e fica com trilha de auditoria.
          </span>
        </p>
      </section>
    </template>

    <BaseDialog
      :open="confirming"
      :title="editing ? CONFIRM_TEXT[editing].title : ''"
      width="sm"
      :locked="saving"
      @update:open="confirming = $event"
    >
      <p class="text-[15px] leading-relaxed text-ink-body">
        {{ editing ? CONFIRM_TEXT[editing].text : "" }}
      </p>
      <dl class="border border-line bg-surface-muted">
        <div class="flex items-baseline justify-between gap-4 border-b border-line-soft px-4 py-3">
          <dt class="text-sm text-ink-muted">Valor atual</dt>
          <dd class="break-all text-right text-[15px] text-ink">{{ oldValue }}</dd>
        </div>
        <div class="flex items-baseline justify-between gap-4 px-4 py-3">
          <dt class="text-sm text-ink-muted">Novo valor</dt>
          <dd class="break-all text-right text-[15px] font-semibold text-brand">
            {{ draft.trim() }}
          </dd>
        </div>
      </dl>
      <div v-if="editing === 'email'" class="flex flex-col gap-1.5">
        <label for="senha-confirmacao" class="text-[15px] font-medium text-ink">Senha atual</label>
        <input
          id="senha-confirmacao"
          v-model="password"
          type="password"
          autocomplete="current-password"
          placeholder="Para confirmar que é você"
          :aria-invalid="passwordError ? 'true' : undefined"
          class="h-[46px] border bg-surface px-3 text-base text-ink focus:outline-none focus:ring-2 focus:ring-brand"
          :class="passwordError ? 'border-2 border-danger' : 'border-field-line'"
          @keydown.enter.prevent="confirm"
        />
        <p v-if="passwordError" class="text-[13px] text-danger" aria-live="polite">
          {{ passwordError }}
        </p>
      </div>
      <template #note>A alteração fica registrada no histórico da conta.</template>
      <template #actions>
        <BaseButton variant="secondary" :disabled="saving" @click="confirming = false">
          Cancelar
        </BaseButton>
        <BaseButton :busy="saving" @click="confirm">
          {{ saving ? "Salvando…" : editing ? CONFIRM_TEXT[editing].action : "" }}
        </BaseButton>
      </template>
    </BaseDialog>
  </SettingsLayout>
</template>
