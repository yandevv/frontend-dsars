<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from "vue";
import { useRoute } from "vue-router";

import AppBreadcrumb from "@/shared/layout/AppBreadcrumb.vue";
import AppShell from "@/shared/layout/AppShell.vue";
import BaseButton from "@/shared/ui/BaseButton.vue";
import CancelRequestsDialog from "@/features/requests/components/CancelRequestsDialog.vue";
import RequestDeadlineCard from "@/features/requests/components/RequestDeadlineCard.vue";
import RequestMessages from "@/features/requests/components/RequestMessages.vue";
import RequestSentAnswer from "@/features/requests/components/RequestSentAnswer.vue";
import RequestStatusChip from "@/features/requests/components/RequestStatusChip.vue";
import RequestSubjectRequest from "@/features/requests/components/RequestSubjectRequest.vue";
import RequestTimeline from "@/features/requests/components/RequestTimeline.vue";
import SurveyForm from "@/features/survey/components/SurveyForm.vue";
import SurveyInvite from "@/features/survey/components/SurveyInvite.vue";
import SurveyRecord from "@/features/survey/components/SurveyRecord.vue";
import SurveyStatusCard from "@/features/survey/components/SurveyStatusCard.vue";
import { submitSurvey, surveyAvailable } from "@/features/survey/services/surveyService";
import { REQUEST_OUTCOME_LABELS, isOpen } from "@/features/requests/constants/requestStatus";
import { cancelRequests, fetchRequest } from "@/features/requests/services/requestService";
import { downloadText } from "@/shared/utils/download";
import { findRight } from "@/shared/constants/lgpdRights";
import { formatDate, formatDateTime } from "@/shared/utils/date";
import { normalizeEmail } from "@/features/auth/data/accounts";
import { useRequestMessages } from "@/features/requests/composables/useRequestMessages";
import { useSession } from "@/features/auth/composables/useSession";
import type { DataRequest, RequestAttachment } from "@/features/requests/types/request";

/**
 * Detalhe da requisição, visão do titular (RF005).
 *
 * A mesma página do encarregado, com cancelar no lugar de finalizar: o titular
 * lê o pedido, a resposta e o histórico — sem o trabalho interno da equipe —, e
 * pode desistir enquanto a requisição estiver em aberto.
 */
const route = useRoute();
const { account } = useSession("titular");

const request = ref<DataRequest | null>(null);
const loading = ref(true);
const missing = ref(false);

const cancelOpen = ref(false);
const cancelling = ref(false);
const notice = ref<{ title: string; text: string } | null>(null);

const open = computed(() => (request.value ? isOpen(request.value.status) : false));

const viewer = computed(() => ({ name: account.value.name, role: "titular" as const }));
const messages = useRequestMessages(request, viewer);
const messagesPanel = useTemplateRef<InstanceType<typeof RequestMessages>>("messagesPanel");

async function sendMessage(message: { text: string; attachments: RequestAttachment[] }) {
  const answeringComplement = request.value?.status === "aguardando-complemento";
  if (!(await messages.send(message))) return;

  messagesPanel.value?.reset();
  if (answeringComplement) {
    notice.value = {
      title: "Complemento enviado",
      text: "A equipe recebeu sua resposta e a requisição voltou para análise.",
    };
  }
}

const rightLabel = computed(() =>
  request.value ? (findRight(request.value.rightNumeral)?.requestLabel ?? "") : "",
);

/** A data que importa agora: a da resposta, a do cancelamento ou a do registro. */
const when = computed(() => {
  const current = request.value;
  if (!current) return "";
  if (current.status === "concluida" && current.closedAt) {
    return `Respondida em ${formatDate(current.closedAt)}`;
  }
  if (current.status === "cancelada" && current.closedAt) {
    return `Cancelada em ${formatDate(current.closedAt)}`;
  }
  return `Registrada em ${formatDate(current.registeredAt)}`;
});

// ── Pesquisa de satisfação ───────────────────────────────────────────────────
/**
 * Em que ponto a pesquisa está nesta visita. O convite aparece na primeira
 * vez; "Agora não" o recolhe, mas a pesquisa continua aberta.
 */
const surveyPhase = ref<"convite" | "formulario" | "dispensada">("convite");
const surveySending = ref(false);

const surveyOpen = computed(
  () => !!request.value && surveyAvailable(request.value) && !request.value.survey,
);

/** Chegou pelo link da notificação ou do e-mail, que já pede o formulário. */
const askedForSurvey = computed(() => route.query.pesquisa === "1");

async function sendSurvey(answer: { rating: number; comment: string }) {
  const current = request.value;
  if (!current || surveySending.value) return;

  surveySending.value = true;
  try {
    request.value = { ...(await submitSurvey(current.id, answer)) };
  } finally {
    surveySending.value = false;
  }
}

async function load(id: string) {
  loading.value = true;
  missing.value = false;
  notice.value = null;
  surveyPhase.value = askedForSurvey.value ? "formulario" : "convite";

  try {
    const found = await fetchRequest(id);
    // Pedido de outra pessoa responde como inexistente: dizer "não é seu"
    // confirmaria que o identificador existe.
    if (normalizeEmail(found.subject.email) !== normalizeEmail(account.value.email)) {
      throw new Error("Requisição de outro titular.");
    }
    request.value = found;
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

async function confirmCancel(reason: string) {
  const current = request.value;
  if (!current) return;

  cancelling.value = true;
  try {
    const { cancelled } = await cancelRequests([current.id], reason);
    cancelOpen.value = false;
    request.value = { ...(cancelled[0] ?? current) };
    notice.value = {
      title: "Requisição cancelada",
      text: `Motivo registrado: “${reason}”. A organização deixou de contar o prazo e não responderá a este pedido.`,
    };
  } finally {
    cancelling.value = false;
  }
}

/** A resposta em texto simples, para guardar junto dos próprios documentos. */
function downloadAnswer() {
  const current = request.value;
  if (!current?.answer) return;

  const { answer } = current;
  const lines = [
    `Requisição ${current.protocol} — ${rightLabel.value}`,
    `Desfecho: ${REQUEST_OUTCOME_LABELS[answer.outcome]}`,
    `Respondida em ${formatDateTime(answer.sentAt)} por ${answer.author}`,
    "",
    answer.text,
    ...(answer.legalBasis ? ["", `Fundamento informado: ${answer.legalBasis}`] : []),
  ];
  downloadText(`resposta-${current.protocol}.txt`, lines.join("\n"), "text/plain");
}
</script>

<template>
  <AppShell role="titular">
    <div class="mx-auto flex max-w-[1200px] flex-col gap-6">
      <AppBreadcrumb
        :trail="[{ label: 'Minhas requisições', to: { name: 'my-requests' } }]"
        :current="request?.protocol ?? 'Requisição'"
      />

      <p v-if="loading" role="status" class="text-[15px] text-ink-soft">Abrindo a requisição…</p>

      <div v-else-if="missing || !request" class="flex max-w-[60ch] flex-col gap-3.5">
        <h1 class="font-serif text-[28px] font-semibold text-ink">
          Não encontramos esta requisição
        </h1>
        <p class="text-[15px] leading-relaxed text-ink-body">
          O endereço pode ter sido copiado pela metade. A sua lista mostra todas as requisições
          que você registrou nesta organização.
        </p>
        <div class="pt-1">
          <BaseButton :to="{ name: 'my-requests' }">Voltar à lista</BaseButton>
        </div>
      </div>

      <template v-else>
        <div
          class="flex flex-col gap-5 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-8"
        >
          <div class="flex flex-col gap-2.5">
            <h1 class="font-serif text-[24px] font-semibold leading-[1.15] text-ink sm:text-[32px]">
              {{ rightLabel }}
            </h1>
            <div class="flex flex-wrap items-center gap-3">
              <RequestStatusChip :status="request.status" />
              <p class="text-[15px] text-ink-soft">
                {{ when }} ·
                <span class="whitespace-nowrap">protocolo {{ request.protocol }}</span>
              </p>
            </div>
          </div>

          <BaseButton
            v-if="open"
            variant="secondary"
            block
            class="sm:w-auto"
            @click="cancelOpen = true"
          >
            Cancelar requisição
          </BaseButton>
          <BaseButton
            v-else-if="request.answer"
            variant="secondary"
            block
            class="sm:w-auto"
            @click="downloadAnswer"
          >
            Baixar a resposta
          </BaseButton>
        </div>

        <div
          v-if="notice"
          role="status"
          class="flex flex-wrap items-start justify-between gap-5 border-l-[3px] border-brand bg-brand-wash px-[18px] py-4"
        >
          <div class="flex max-w-[78ch] flex-col gap-1">
            <p class="text-base font-semibold text-ink">
              {{ notice.title }}
            </p>
            <p class="text-[15px] leading-normal text-ink-body">
              {{ notice.text }}
            </p>
          </div>
          <button
            type="button"
            class="py-1 text-sm text-brand underline hover:text-brand-strong"
            @click="notice = null"
          >
            Entendi
          </button>
        </div>

        <SurveyInvite
          v-if="surveyOpen && surveyPhase === 'convite'"
          @start="surveyPhase = 'formulario'"
          @dismiss="surveyPhase = 'dispensada'"
        />

        <!-- Link antigo para a pesquisa de uma requisição que ainda não a tem. -->
        <section
          v-if="askedForSurvey && !surveyAvailable(request)"
          class="flex flex-col gap-2.5 border-l-[3px] border-ink-muted bg-field-disabled px-[18px] py-[18px]"
        >
          <h2 class="font-serif text-[22px] font-semibold leading-tight text-ink">
            {{
              request.status === "cancelada"
                ? "Requisições canceladas não têm pesquisa"
                : "A pesquisa abre quando a requisição for finalizada"
            }}
          </h2>
          <p class="max-w-[72ch] text-[15px] leading-relaxed text-ink-body">
            {{
              request.status === "cancelada"
                ? "Como o pedido foi cancelado antes da resposta, não há atendimento para avaliar."
                : "Enquanto o pedido está em andamento não há convite nem pesquisa. Assim que a resposta chegar, ela fica disponível aqui."
            }}
          </p>
        </section>

        <div class="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div class="flex flex-col gap-6">
            <SurveyForm
              v-if="surveyOpen && surveyPhase === 'formulario'"
              :sending="surveySending"
              @submit="sendSurvey"
              @close="surveyPhase = 'dispensada'"
            />
            <SurveyRecord v-else-if="request.survey" :answer="request.survey" />

            <RequestSentAnswer v-if="request.answer" :answer="request.answer" audience="titular" />

            <RequestSubjectRequest :request="request" audience="titular" />

            <p
              v-if="messages.error.value"
              role="alert"
              class="border-l-[3px] border-danger bg-danger-wash px-4 py-3 text-[15px] text-danger-body"
            >
              {{ messages.error.value }}
            </p>
            <RequestMessages
              ref="messagesPanel"
              :messages="request.messages"
              :viewer="viewer"
              :open="open"
              :sending="messages.sending.value"
              @send="sendMessage"
              @edit="messages.edit"
              @remove="messages.remove"
            />

            <RequestTimeline :entries="request.timeline" audience="titular" />
          </div>

          <div class="flex flex-col gap-[18px]">
            <RequestDeadlineCard :request="request" audience="titular" />

            <SurveyStatusCard
              v-if="surveyAvailable(request)"
              :answer="request.survey"
              :released-at="request.closedAt"
              :dismissed="surveyPhase === 'dispensada'"
            />

            <section class="flex flex-col gap-3 border border-line bg-surface px-5 py-[18px]">
              <h2
                class="font-label text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-soft"
              >
                Identificação do pedido
              </h2>
              <dl class="flex flex-col gap-3">
                <div class="flex flex-col gap-0.5">
                  <dt class="text-[13px] text-ink-muted">Protocolo</dt>
                  <dd class="font-label text-base font-semibold text-ink">
                    {{ request.protocol }}
                  </dd>
                </div>
                <div class="flex flex-col gap-0.5">
                  <dt class="text-[13px] text-ink-muted">Identificador</dt>
                  <dd class="break-all font-label text-sm text-ink-body">
                    {{ request.id }}
                  </dd>
                </div>
              </dl>
              <p class="text-sm leading-normal text-ink-soft">
                Cite o protocolo em qualquer contato com a organização ou com a Autoridade Nacional
                de Proteção de Dados.
              </p>
            </section>

            <section
              v-if="open"
              class="flex flex-col gap-2.5 border border-line bg-surface-muted px-5 py-[18px]"
            >
              <h2
                class="font-label text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-soft"
              >
                O que acontece agora
              </h2>
              <p class="text-sm leading-relaxed text-ink-body">
                A equipe analisa o pedido e responde por aqui. Se faltar alguma informação, você
                recebe um pedido de complemento no portal e por e-mail.
              </p>
              <p class="text-sm leading-relaxed text-ink-soft">
                Cancelar é definitivo: a organização deixa de contar o prazo e não responderá ao
                pedido.
              </p>
            </section>
          </div>
        </div>
      </template>
    </div>

    <CancelRequestsDialog
      v-model:open="cancelOpen"
      :requests="request ? [request] : []"
      mode="individual"
      :sending="cancelling"
      @confirm="confirmCancel"
    />
  </AppShell>
</template>
