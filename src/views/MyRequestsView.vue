<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";

import AppShell from "@/shared/layout/AppShell.vue";
import BaseButton from "@/shared/ui/BaseButton.vue";
import MyRequestsIndicators from "@/features/requests/components/MyRequestsIndicators.vue";
import CancelRequestsDialog from "@/features/requests/components/CancelRequestsDialog.vue";
import MyRequestsList from "@/features/requests/components/MyRequestsList.vue";
import QueueSkeleton from "@/features/requests/components/QueueSkeleton.vue";
import { LEGAL_DEADLINE_DAYS } from "@/features/requests/constants/requestPolicy";
import { cancelRequests } from "@/features/requests/services/requestService";
import { useMyRequests } from "@/features/requests/composables/useMyRequests";
import { useSession } from "@/features/auth/composables/useSession";
import type { DataRequest } from "@/features/requests/types/request";

/**
 * Turno 1 · Tela 5 — Minhas requisições (RF008 / RF009).
 *
 * A lista do titular, com o prazo em primeiro plano. A seleção em lote aceita
 * só o que ainda está em andamento: acessar abre uma aba por requisição, e
 * cancelar — ato exclusivo do titular — pede um motivo único para o conjunto.
 */
const router = useRouter();
const { account } = useSession("titular");

const list = useMyRequests(() => account.value.email);

const confirmed = computed(() => account.value.emailConfirmed);
/** Aviso sobre a lista: o que acabou de acontecer, com título quando pesa. */
const notice = ref<{ title?: string; text: string } | null>(null);

const empty = computed(() => !list.loading.value && list.requests.value.length === 0);

const selectionLabel = computed(() =>
  list.selected.value.length === 1
    ? "1 requisição selecionada"
    : `${list.selected.value.length} requisições selecionadas`,
);

const footer = computed(() => {
  const total = list.requests.value.length;
  return `${total} ${total === 1 ? "requisição" : "requisições"} · apenas as suas. Concluídas e canceladas não entram na seleção em lote.`;
});

/** Uma aba por requisição; a lista fica onde está, com a seleção preservada. */
function openInTabs() {
  const ids = list.selected.value;
  for (const id of ids) {
    const { href } = router.resolve({ name: "my-request-detail", params: { id } });
    window.open(href, "_blank", "noopener");
  }
  notice.value = {
    text:
      ids.length === 1
        ? "Abrimos 1 aba com o detalhe da requisição selecionada. Esta lista continua aqui, com a seleção preservada."
        : `Abrimos ${ids.length} abas, uma por requisição. Esta lista continua aqui, com a seleção preservada.`,
  };
}

// ── Cancelamento ─────────────────────────────────────────────────────────────
const cancelOpen = ref(false);
const cancelMode = ref<"individual" | "lote">("lote");
const cancelTargets = ref<DataRequest[]>([]);
const cancelling = ref(false);

function cancelOne(request: DataRequest) {
  cancelMode.value = "individual";
  cancelTargets.value = [request];
  cancelOpen.value = true;
}

function cancelSelected() {
  cancelMode.value = "lote";
  cancelTargets.value = list.selectable.value.filter((request) =>
    list.selected.value.includes(request.id),
  );
  cancelOpen.value = true;
}

async function confirmCancel(reason: string) {
  cancelling.value = true;
  try {
    const { cancelled, skipped } = await cancelRequests(
      cancelTargets.value.map((request) => request.id),
      reason,
    );
    cancelOpen.value = false;
    await list.reload({ quiet: true });

    const left =
      skipped.length > 0
        ? ` ${skipped.map((request) => request.protocol).join(", ")} já estava encerrada e ficou de fora.`
        : "";
    notice.value = {
      title:
        cancelled.length === 1 ? "Requisição cancelada" : `${cancelled.length} requisições canceladas`,
      text: `Motivo registrado: “${reason}”. O histórico de cada requisição guarda data, hora e motivo.${left}`,
    };
  } finally {
    cancelling.value = false;
  }
}
</script>

<template>
  <AppShell role="titular">
    <div class="mx-auto flex max-w-[1200px] flex-col gap-6">
      <!-- Conta pendente: dá para ver a lista, não para registrar. -->
      <section
        v-if="!confirmed"
        aria-labelledby="titulo-pendencia"
        class="flex flex-wrap items-start justify-between gap-6 border border-pending-line bg-pending-wash px-5 py-5 lg:px-6"
      >
        <div class="flex max-w-[70ch] flex-col gap-1.5">
          <h2
            id="titulo-pendencia"
            class="text-base font-semibold text-ink"
          >
            Sua conta está pendente de confirmação de e-mail
          </h2>
          <p class="text-[15px] leading-relaxed text-ink-body">
            Registrar uma requisição exige o endereço confirmado. Enviamos o link para
            <strong class="font-semibold">{{ account.email }}</strong> — ele vale 24 horas.
          </p>
        </div>
        <div class="flex flex-wrap gap-2.5">
          <!-- O reenvio mora na tela de confirmação, com o intervalo mínimo à vista. -->
          <BaseButton
            size="sm"
            :to="{
              name: 'email-confirmation',
              query: { origem: 'cadastro', email: account.email },
            }"
          >
            Reenviar link
          </BaseButton>
          <BaseButton
            size="sm"
            variant="secondary"
            :to="{ name: 'settings' }"
          >
            Corrigir e-mail
          </BaseButton>
        </div>
      </section>

      <div
        class="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-8"
      >
        <div class="flex flex-col gap-2">
          <h1 class="font-serif text-[26px] font-semibold leading-[1.15] text-ink sm:text-[34px]">
            Minhas requisições
          </h1>
          <p class="hidden max-w-[62ch] text-base leading-relaxed text-ink-body sm:block">
            Aqui aparecem apenas os pedidos feitos por você a esta organização. O prazo é contado da
            data de registro.
          </p>
        </div>
        <div class="flex flex-col gap-1.5 sm:items-end">
          <BaseButton
            :to="confirmed ? { name: 'new-request' } : undefined"
            :disabled="!confirmed"
            block
            class="sm:w-auto"
          >
            Nova requisição
          </BaseButton>
          <p
            v-if="!confirmed"
            class="text-[13px] text-ink-muted"
          >
            Disponível após a confirmação do e-mail
          </p>
        </div>
      </div>

      <QueueSkeleton
        v-if="list.loading.value"
        label="Buscando suas requisições…"
      />

      <!-- Nada registrado ainda: a tela vira convite, não tabela vazia. -->
      <section
        v-else-if="empty"
        class="flex flex-col items-center gap-5 border border-dashed border-line-strong bg-surface-muted px-6 py-14 text-center sm:px-10"
      >
        <div class="flex flex-col items-center gap-2.5">
          <h2 class="font-serif text-[22px] font-semibold text-ink sm:text-[26px]">
            {{
              confirmed ? "Você ainda não registrou requisições" : "Nada para mostrar por enquanto"
            }}
          </h2>
          <p class="max-w-[64ch] text-base leading-relaxed text-ink-soft">
            <template v-if="confirmed">
              A LGPD garante que você peça acesso, correção, eliminação, portabilidade e informações
              sobre o uso dos seus dados. A organização tem até
              {{ LEGAL_DEADLINE_DAYS }} dias para responder.
            </template>
            <template v-else>
              Confirme o e-mail para liberar o registro. Enquanto isso, você pode consultar os
              prazos legais e os tipos de pedido previstos na LGPD.
            </template>
          </p>
        </div>
        <div class="flex flex-wrap justify-center gap-2.5">
          <BaseButton
            v-if="confirmed"
            size="sm"
            :to="{ name: 'new-request' }"
          >
            Registrar a primeira requisição
          </BaseButton>
          <BaseButton
            size="sm"
            variant="secondary"
            :to="{ name: 'home', hash: '#titulo-direitos' }"
          >
            Ver os direitos previstos na lei
          </BaseButton>
        </div>
      </section>

      <template v-else>
        <MyRequestsIndicators :counts="list.counts.value" />

        <div
          v-if="list.selected.value.length > 0"
          class="flex flex-wrap items-center justify-between gap-6 bg-ink px-5 py-3.5"
        >
          <div class="flex flex-wrap items-center gap-4">
            <p
              aria-live="polite"
              class="text-[15px] font-semibold text-white"
            >
              {{ selectionLabel }}
            </p>
            <button
              type="button"
              class="py-1 text-sm text-ink-on-dark underline hover:text-white"
              @click="list.selected.value = []"
            >
              Limpar seleção
            </button>
          </div>
          <div class="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              class="border border-white bg-white px-5 py-[13px] text-[15px] font-semibold text-ink"
              @click="openInTabs"
            >
              Acessar em abas
            </button>
            <button
              type="button"
              class="border border-line-on-dark px-5 py-[13px] text-[15px] font-medium text-white hover:border-white"
              @click="cancelSelected"
            >
              Cancelar selecionadas
            </button>
          </div>
        </div>

        <div
          v-if="notice"
          role="status"
          class="flex flex-wrap items-center justify-between gap-5 border-l-[3px] border-brand bg-brand-wash px-[18px] py-3.5"
        >
          <div class="flex max-w-[78ch] flex-col gap-1">
            <p v-if="notice.title" class="text-base font-semibold text-ink">
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

        <MyRequestsList
          v-model:selected="list.selected.value"
          :requests="list.requests.value"
          @cancel="cancelOne"
        />

        <div class="flex flex-wrap items-center justify-between gap-6">
          <p class="text-sm leading-normal text-ink-soft">
            {{ footer }}
          </p>
          <RouterLink
            :to="{ name: 'help' }"
            class="text-sm text-brand hover:text-brand-strong"
          >
            Como os prazos da LGPD são contados
          </RouterLink>
        </div>
      </template>
    </div>

    <CancelRequestsDialog
      v-model:open="cancelOpen"
      :requests="cancelTargets"
      :mode="cancelMode"
      :sending="cancelling"
      @confirm="confirmCancel"
    />
  </AppShell>
</template>
