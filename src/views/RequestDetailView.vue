<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import AppBreadcrumb from '@/shared/layout/AppBreadcrumb.vue'
import AppShell from '@/shared/layout/AppShell.vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import RequestAnswerPanel from '@/features/requests/components/RequestAnswerPanel.vue'
import RequestAssigneeCard from '@/features/requests/components/RequestAssigneeCard.vue'
import RequestDeadlineCard from '@/features/requests/components/RequestDeadlineCard.vue'
import RequestInternalNotes from '@/features/requests/components/RequestInternalNotes.vue'
import RequestSentAnswer from '@/features/requests/components/RequestSentAnswer.vue'
import RequestStatusChip from '@/features/requests/components/RequestStatusChip.vue'
import RequestSubjectCard from '@/features/requests/components/RequestSubjectCard.vue'
import RequestSubjectRequest from '@/features/requests/components/RequestSubjectRequest.vue'
import RequestTimeline from '@/features/requests/components/RequestTimeline.vue'
import { LEGAL_DEADLINE_DAYS } from '@/features/requests/constants/requestPolicy'
import { deadlineStatusOf } from '@/features/requests/utils/deadline'
import { findRight } from '@/shared/constants/lgpdRights'
import { formatDate } from '@/shared/utils/date'
import { isOpen } from '@/features/requests/constants/requestStatus'
import {
  answerRequest,
  askForComplement,
  fetchRequest,
  listRequests,
  reassignRequest,
} from '@/features/requests/services/requestService'
import type { DataRequest, RequestOutcome } from '@/features/requests/types/request'

/**
 * Turno 1 · Tela 11 — Detalhe da requisição na visão do encarregado
 * (RF005 / RF006 / RF007 / RF012 / RF013 / RF014).
 *
 * É a mesma página que o titular vê, com finalizar atendimento no lugar de
 * cancelar: cancelar é ato do titular (RF010), e nenhuma ação daqui apaga a
 * requisição — o que existe é responder, pedir complemento e reatribuir, tudo
 * com registro na trilha.
 */
const route = useRoute()

const request = ref<DataRequest | null>(null)
const others = ref<readonly DataRequest[]>([])
const loading = ref(true)
const missing = ref(false)
const panelOpen = ref(false)
const sending = ref(false)

type Notice = { title: string; text: string; tone: 'danger' | 'ok' }
const notice = ref<Notice | null>(null)
const dismissed = ref(false)

const open = computed(() => (request.value ? isOpen(request.value.status) : false))

const overdueNotice = computed<Notice | null>(() => {
  const current = request.value
  if (!current || !open.value || deadlineStatusOf(current) !== 'vencida') return null

  return {
    title: 'Requisição fora do prazo legal',
    text: `O prazo de ${LEGAL_DEADLINE_DAYS} dias venceu em ${formatDate(current.dueAt)}. Finalize o atendimento hoje e registre a causa do atraso na nota interna — o relatório à diretoria usa esse campo.`,
    tone: 'danger',
  }
})

const shownNotice = computed(() => notice.value ?? (dismissed.value ? null : overdueNotice.value))

const rightLabel = computed(() =>
  request.value ? (findRight(request.value.rightNumeral)?.requestLabel ?? '') : '',
)

const meta = computed(() => {
  const current = request.value
  if (!current) return ''
  return `Protocolo ${current.protocol} · registrada em ${formatDate(current.registeredAt)} · titular ${current.subject.name}`
})

async function load(protocol: string) {
  loading.value = true
  missing.value = false
  notice.value = null
  dismissed.value = false
  panelOpen.value = false

  try {
    const found = await fetchRequest(protocol)
    request.value = found
    others.value = (await listRequests()).filter(
      (item) => item.protocol !== found.protocol && item.subject.email === found.subject.email,
    )
  } catch {
    request.value = null
    missing.value = true
  } finally {
    loading.value = false
  }
}

watch(() => route.params.protocol, (protocol) => {
  if (typeof protocol === 'string') void load(protocol)
}, { immediate: true })

async function finish(answer: { outcome: RequestOutcome; text: string; legalBasis?: string }) {
  const current = request.value
  if (!current || sending.value) return

  sending.value = true
  try {
    request.value = { ...(await answerRequest(current.protocol, answer)) }
    panelOpen.value = false
    notice.value = {
      title: 'Atendimento finalizado',
      text: 'O titular foi notificado no portal e por e-mail. A requisição saiu da fila e a pesquisa de satisfação está liberada.',
      tone: 'ok',
    }
  } finally {
    sending.value = false
  }
}

async function requestComplement() {
  const current = request.value
  if (!current) return

  request.value = {
    ...(await askForComplement(current.protocol, {
      detail:
        'Pedido enviado pelo portal e por e-mail. O prazo legal continua correndo enquanto se espera a resposta.',
    })),
  }
  panelOpen.value = false
  notice.value = {
    title: 'Complemento solicitado ao titular',
    text: 'A requisição continua na fila e o prazo legal segue correndo. Finalizar atendimento permanece disponível.',
    tone: 'ok',
  }
}

async function reassign(to: string) {
  const current = request.value
  if (!current) return

  request.value = { ...(await reassignRequest(current.protocol, { to })) }
  notice.value = {
    title: 'Requisição reatribuída',
    text: `${to} recebeu a notificação com o prazo restante. A troca ficou registrada na trilha de auditoria.`,
    tone: 'ok',
  }
}
</script>

<template>
  <AppShell role="encarregado">
    <div class="mx-auto flex max-w-[1360px] flex-col gap-6">
      <AppBreadcrumb
        :trail="[{ label: 'Fila de atendimento', to: { name: 'request-queue' } }]"
        :current="String(route.params.protocol)"
      />

      <p
        v-if="loading"
        role="status"
        class="text-[15px] text-ink-soft"
      >
        Abrindo a requisição…
      </p>

      <div
        v-else-if="missing || !request"
        class="flex max-w-[60ch] flex-col gap-3.5"
      >
        <h1 class="font-serif text-[28px] font-semibold text-ink">
          Não encontramos a requisição {{ route.params.protocol }}
        </h1>
        <p class="text-[15px] leading-relaxed text-ink-body">
          O protocolo pode ter sido digitado com um dígito a menos, ou pertencer a outra
          organização. A fila mostra tudo o que está sob o escopo deste portal.
        </p>
        <div class="pt-1">
          <BaseButton :to="{ name: 'request-queue' }">
            Voltar à fila
          </BaseButton>
        </div>
      </div>

      <template v-else>
        <div class="flex flex-wrap items-start justify-between gap-8">
          <div class="flex flex-col gap-2.5">
            <h1 class="font-serif text-[32px] font-semibold leading-[1.15] text-ink">
              {{ rightLabel }}
            </h1>
            <div class="flex flex-wrap items-center gap-3">
              <RequestStatusChip :status="request.status" />
              <p class="text-[15px] text-ink-soft">
                {{ meta }}
              </p>
            </div>
          </div>

          <div
            v-if="open"
            class="flex flex-wrap items-center gap-2.5"
          >
            <BaseButton
              variant="secondary"
              @click="requestComplement"
            >
              Pedir complemento
            </BaseButton>
            <BaseButton @click="panelOpen = true">
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
            @click="notice = null; dismissed = true"
          >
            Entendi
          </button>
        </div>

        <div class="grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div class="flex flex-col gap-6">
            <RequestSubjectRequest :request="request" />

            <RequestAnswerPanel
              v-if="panelOpen && open"
              :sending="sending"
              @close="panelOpen = false"
              @submit="finish"
            />

            <RequestSentAnswer
              v-if="request.answer"
              :answer="request.answer"
            />

            <RequestTimeline :entries="request.timeline" />

            <RequestInternalNotes :notes="request.notes" />
          </div>

          <div class="flex flex-col gap-[18px]">
            <RequestDeadlineCard :request="request" />

            <RequestSubjectCard
              :subject="request.subject"
              :others="others"
            />

            <RequestAssigneeCard
              :assignee="request.assignee"
              :disabled="!open"
              @reassign="reassign"
            />

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
                O encarregado não cancela nem apaga requisições: cancelar é ato do titular (RF010).
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
