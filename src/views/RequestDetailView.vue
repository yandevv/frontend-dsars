<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch } from "vue";
import { useRoute } from "vue-router";

import AppBreadcrumb from "@/shared/layout/AppBreadcrumb.vue";
import AppShell from "@/shared/layout/AppShell.vue";
import BaseButton from "@/shared/ui/BaseButton.vue";
import RequestAnswerPanel from "@/features/requests/components/RequestAnswerPanel.vue";
import RequestDeadlineCard from "@/features/requests/components/RequestDeadlineCard.vue";
import RequestMessages from "@/features/requests/components/RequestMessages.vue";
import RequestSentAnswer from "@/features/requests/components/RequestSentAnswer.vue";
import RequestStatusChip from "@/features/requests/components/RequestStatusChip.vue";
import RequestSubjectCard from "@/features/requests/components/RequestSubjectCard.vue";
import RequestSubjectRequest from "@/features/requests/components/RequestSubjectRequest.vue";
import RequestTimeline from "@/features/requests/components/RequestTimeline.vue";
import { deadlineLabel, deadlineStatusOf } from "@/features/requests/utils/deadline";
import { formatDue, requestIsImmediate } from "@/features/requests/utils/responseDeadline";
import { DEADLINE_TEXT_CLASSES } from "@/features/requests/constants/deadlineStyles";
import { findRight } from "@/shared/constants/lgpdRights";
import { formatDate } from "@/shared/utils/date";
import { isOpen } from "@/features/requests/constants/requestStatus";
import {
  answerRequest,
  downloadAttachment,
  fetchRequest,
  listOrganizationRequests,
} from "@/features/requests/services/requestService";
import { useRequestMessages } from "@/features/requests/composables/useRequestMessages";
import { messageOf } from "@/shared/api/ApiError";
import type { DataRequest, RequestAttachment } from "@/features/requests/types/request";

/**
 * Turno 1 · Tela 11 — Detalhe da requisição na visão do encarregado
 * (RF005 / RF006 / RF007 / RF012 / RF013 / RF014).
 *
 * É a mesma página que o titular vê, com finalizar atendimento no lugar de
 * cancelar: cancelar é ato do titular (RF010), e nenhuma ação daqui apaga a
 * requisição — o que existe é conversar com o titular e responder, tudo com
 * registro na trilha.
 */
const route = useRoute();

const request = ref<DataRequest | null>(null);
const others = ref<readonly DataRequest[]>([]);
const loading = ref(true);
const missing = ref(false);
const panelOpen = ref(false);
const sending = ref(false);

type Notice = { title: string; text: string; tone: "danger" | "ok" };
const notice = ref<Notice | null>(null);
const dismissed = ref(false);

const open = computed(() => (request.value ? isOpen(request.value.status) : false));

// No celular a finalização cobre a tela inteira; o foco vai para ela ao abrir
// para que o leitor de tela não fique preso no botão que sumiu atrás.
const answerSheet = useTemplateRef<HTMLElement>("answerSheet");

// ── Conversa ─────────────────────────────────────────────────────────────────
const messages = useRequestMessages(request);
const messagesPanel = useTemplateRef<InstanceType<typeof RequestMessages>>("messagesPanel");

/**
 * Pedir complemento é escrever ao titular: o campo da conversa muda de modo,
 * e a mensagem sai como qualquer outra — a requisição segue aberta.
 */
const complementMode = ref(false);

async function askForComplement() {
  complementMode.value = true;
  panelOpen.value = false;
  await nextTick();
  messagesPanel.value?.focus();
}

async function sendMessage(message: { text: string; attachments: RequestAttachment[] }) {
  const complement = complementMode.value;
  if (!(await messages.send(message))) return;

  messagesPanel.value?.reset();
  complementMode.value = false;
  if (complement) {
    notice.value = {
      title: "Complemento solicitado ao titular",
      text: "A requisição continua na fila e o prazo legal segue correndo. Finalizar atendimento permanece disponível.",
      tone: "ok",
    };
  }
}

async function download(attachmentId: string) {
  const current = request.value;
  if (!current) return;
  try {
    await downloadAttachment(current.id, attachmentId);
  } catch (error) {
    notice.value = { title: "Não foi possível baixar o anexo", text: messageOf(error), tone: "danger" };
  }
}

async function openPanel() {
  panelOpen.value = true;
  await nextTick();
  answerSheet.value?.focus();
}

const overdueNotice = computed<Notice | null>(() => {
  const current = request.value;
  if (!current || !open.value || deadlineStatusOf(current) !== "vencida") return null;

  return {
    title: "Requisição fora do prazo legal",
    text: `O prazo legal venceu em ${formatDue(current.dueAt, requestIsImmediate(current))}. Finalize o atendimento o quanto antes — o atraso aparece no relatório gerencial.`,
    tone: "danger",
  };
});

const shownNotice = computed(() => notice.value ?? (dismissed.value ? null : overdueNotice.value));

const rightLabel = computed(() =>
  request.value ? (findRight(request.value.rightNumeral)?.requestLabel ?? "") : "",
);

/** O prazo relativo que o cabeçalho do celular mostra ao lado do estado. */
const deadlineShort = computed(() => {
  const current = request.value;
  if (!current || !open.value) return null;
  return {
    label: deadlineLabel(current),
    classes: DEADLINE_TEXT_CLASSES[deadlineStatusOf(current)],
  };
});

const meta = computed(() => {
  const current = request.value;
  if (!current) return "";
  return `Protocolo ${current.protocol} · registrada em ${formatDate(current.registeredAt)} · titular ${current.subject.name}`;
});

async function load(id: string) {
  loading.value = true;
  missing.value = false;
  notice.value = null;
  dismissed.value = false;
  panelOpen.value = false;

  try {
    const found = await fetchRequest(id);
    request.value = found;
    // As outras requisições do mesmo titular são contexto: se a fila falhar,
    // o detalhe abre do mesmo jeito.
    others.value = (await listOrganizationRequests().catch(() => [])).filter(
      (item) => item.id !== found.id && !!found.subject.id && item.subject.id === found.subject.id,
    );
  } catch {
    request.value = null;
    missing.value = true;
  } finally {
    loading.value = false;
  }
}

watch(
  () => route.params.id,
  (id) => {
    if (typeof id === "string") void load(id);
  },
  { immediate: true },
);

async function finish(answer: { text: string; attachments: RequestAttachment[] }) {
  const current = request.value;
  if (!current || sending.value) return;

  sending.value = true;
  try {
    await answerRequest(current.id, answer);
    request.value = await fetchRequest(current.id);
    panelOpen.value = false;
    notice.value = {
      title: "Atendimento finalizado",
      text: "O titular foi notificado no portal e por e-mail. A requisição saiu da fila e a pesquisa de satisfação está liberada.",
      tone: "ok",
    };
  } catch (error) {
    notice.value = {
      title: "Não foi possível finalizar o atendimento",
      text: messageOf(error),
      tone: "danger",
    };
  } finally {
    sending.value = false;
  }
}
</script>

<template>
  <AppShell role="encarregado">
    <div class="mx-auto flex max-w-[1360px] flex-col gap-6">
      <AppBreadcrumb
        :trail="[{ label: 'Fila de atendimento', to: { name: 'request-queue' } }]"
        :current="request?.protocol ?? 'Requisição'"
      />

      <p v-if="loading" role="status" class="text-[15px] text-ink-soft">Abrindo a requisição…</p>

      <div v-else-if="missing || !request" class="flex max-w-[60ch] flex-col gap-3.5">
        <h1 class="font-serif text-[28px] font-semibold text-ink">
          Não encontramos esta requisição
        </h1>
        <p class="text-[15px] leading-relaxed text-ink-body">
          O endereço pode ter sido copiado pela metade, ou a requisição pertencer a outra
          organização. A fila mostra tudo o que está sob o escopo deste portal.
        </p>
        <div class="pt-1">
          <BaseButton :to="{ name: 'request-queue' }"> Voltar à fila </BaseButton>
        </div>
      </div>

      <template v-else>
        <div class="flex flex-wrap items-start justify-between gap-8">
          <div class="flex flex-col gap-2.5">
            <h1 class="font-serif text-[20px] font-semibold leading-[1.15] text-ink sm:text-[32px]">
              {{ rightLabel }}
            </h1>
            <div class="flex flex-wrap items-center gap-2 sm:gap-3">
              <RequestStatusChip :status="request.status" />
              <p v-if="deadlineShort" class="text-[13px] sm:hidden" :class="deadlineShort.classes">
                {{ deadlineShort.label }}
              </p>
              <p class="hidden text-[15px] text-ink-soft sm:block">
                {{ meta }}
              </p>
            </div>
          </div>

          <!-- No celular as ações vão empilhadas e com a principal primeiro. -->
          <div
            v-if="open"
            class="flex w-full flex-col-reverse gap-2.5 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center"
          >
            <BaseButton variant="secondary" block class="sm:w-auto" @click="askForComplement">
              Pedir complemento
            </BaseButton>
            <BaseButton block class="sm:w-auto" @click="openPanel">
              Finalizar atendimento
            </BaseButton>
          </div>
        </div>

        <div
          v-if="shownNotice"
          :role="shownNotice.tone === 'danger' ? 'alert' : 'status'"
          class="flex flex-wrap items-start justify-between gap-5 border-l-[3px] px-[18px] py-4"
          :class="
            shownNotice.tone === 'danger'
              ? 'border-danger bg-danger-wash'
              : 'border-brand bg-brand-wash'
          "
        >
          <div class="flex max-w-[78ch] flex-col gap-1">
            <p class="text-base font-semibold text-ink">
              {{ shownNotice.title }}
            </p>
            <p class="text-[15px] leading-normal text-ink-body">
              {{ shownNotice.text }}
            </p>
          </div>
          <button
            type="button"
            class="py-1 text-sm text-brand underline hover:text-brand-strong"
            @click="
              notice = null;
              dismissed = true;
            "
          >
            Entendi
          </button>
        </div>

        <div class="grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div class="flex flex-col gap-6">
            <RequestSubjectRequest :request="request" @download="download" />

            <div
              v-if="panelOpen && open"
              ref="answerSheet"
              tabindex="-1"
              class="outline-none max-md:fixed max-md:inset-0 max-md:z-40 max-md:overflow-y-auto max-md:bg-surface"
              @keydown.esc="panelOpen = false"
            >
              <div
                class="sticky top-0 z-10 flex flex-col gap-1 border-b border-line bg-surface-muted px-5 py-3.5 md:hidden"
              >
                <p
                  class="font-label text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-soft"
                >
                  Pedido do titular · {{ request.protocol }}
                </p>
                <p class="line-clamp-3 text-sm leading-normal text-ink-body">
                  {{ request.description }}
                </p>
              </div>
              <RequestAnswerPanel :sending="sending" @close="panelOpen = false" @submit="finish" />
            </div>

            <RequestSentAnswer v-if="request.answer" :answer="request.answer" @download="download" />

            <p v-if="messages.error.value" role="alert" class="border-l-[3px] border-danger bg-danger-wash px-4 py-3 text-[15px] text-danger-body">
              {{ messages.error.value }}
            </p>
            <RequestMessages
              ref="messagesPanel"
              :messages="request.messages"
              :open="open"
              :mode="complementMode ? 'complemento' : 'mensagem'"
              :sending="messages.sending.value"
              @send="sendMessage"
              @edit="messages.edit"
              @remove="messages.remove"
              @download="download"
              @cancel-complement="complementMode = false"
            />

            <RequestTimeline :entries="request.timeline" />
          </div>

          <div class="flex flex-col gap-[18px]">
            <RequestDeadlineCard :request="request" />

            <RequestSubjectCard :subject="request.subject" :others="others" />

            <section
              v-if="open"
              class="flex flex-col gap-2.5 border border-line bg-surface-muted px-5 py-[18px]"
            >
              <h2
                class="font-label text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-soft"
              >
                Ações disponíveis
              </h2>
              <p class="text-sm leading-relaxed text-ink-body">
                Finalizar atendimento e pedir complemento existem apenas enquanto a requisição está
                em aberto.
              </p>
              <p class="text-sm leading-relaxed text-ink-soft">
                O encarregado não cancela nem apaga requisições: cancelar é ato do titular.
              </p>
            </section>

            <section
              v-else
              class="flex flex-col gap-2.5 border-l-[3px] border-ink-muted bg-field-disabled px-[18px] py-[18px]"
            >
              <h2 class="font-serif text-[22px] font-semibold leading-tight text-ink">
                Não há mais ação de finalizar
              </h2>
              <p class="text-[15px] leading-relaxed text-ink-body">
                A requisição encerrada abre em leitura: pedido, resposta enviada, anexos e trilha
                completa. Corrigir uma resposta exige nova requisição, que nasce com prazo próprio.
              </p>
            </section>
          </div>
        </div>
      </template>
    </div>
  </AppShell>
</template>
