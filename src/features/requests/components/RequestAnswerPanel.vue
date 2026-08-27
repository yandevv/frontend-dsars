<script setup lang="ts">
import { computed, nextTick, ref, useId, useTemplateRef, watch } from 'vue'

import AttachmentPicker from '@/features/requests/components/AttachmentPicker.vue'
import BaseAlert from '@/shared/ui/BaseAlert.vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import BasePanel from '@/shared/ui/BasePanel.vue'
import BaseSelect from '@/shared/ui/BaseSelect.vue'
import BaseTextarea from '@/shared/ui/BaseTextarea.vue'
import {
  ANSWER_ATTACHMENT_ACCEPT,
  ANSWER_ATTACHMENT_MAX_BYTES,
  ANSWER_ATTACHMENT_RULE,
  ANSWER_MAX_LENGTH,
  ANSWER_MIN_LENGTH,
  REFUSAL_GROUNDS,
} from '@/features/requests/constants/requestPolicy'
import { REQUEST_OUTCOME_LABELS } from '@/features/requests/constants/requestStatus'
import type { RequestAttachment, RequestOutcome } from '@/features/requests/types/request'

/**
 * Finalização do atendimento (RF013).
 *
 * A recusa é o único desfecho que exige fundamento, e o campo trava o envio:
 * recusar sem dizer com base em quê é o que expõe a organização numa
 * fiscalização — e deixa o titular sem saber a quem recorrer.
 */
const { sending = false } = defineProps<{ sending?: boolean }>()

const emit = defineEmits<{
  close: []
  submit: [{ outcome: RequestOutcome; text: string; legalBasis?: string }]
}>()

const outcomes: { value: RequestOutcome; detail: string }[] = [
  { value: 'atendido', detail: 'O pedido foi cumprido integralmente.' },
  { value: 'parcialmente-atendido', detail: 'Parte dos dados tem guarda obrigatória.' },
  { value: 'recusado', detail: 'Exige fundamento legal expresso.' },
]

const outcome = ref<RequestOutcome | null>(null)
const text = ref('')
const legalBasis = ref('')
const attachments = ref<RequestAttachment[]>([])
const acknowledged = ref(false)
const attempted = ref(false)
const summary = useTemplateRef<HTMLElement>('summary')

const groupName = useId()
const acknowledgeId = useId()

const refused = computed(() => outcome.value === 'recusado')
const textOk = computed(() => text.value.trim().length >= ANSWER_MIN_LENGTH)
const basisOk = computed(() => !refused.value || legalBasis.value !== '')
const isComplete = computed(
  () => outcome.value !== null && textOk.value && basisOk.value && acknowledged.value,
)

const groundOptions = computed(() => [
  { value: '', label: 'Selecione o fundamento' },
  ...REFUSAL_GROUNDS.map((ground) => ({ value: ground, label: ground })),
])

const textLabel = computed(() => (refused.value ? 'Justificativa ao titular' : 'Resposta ao titular'))

const textDescription = computed(() =>
  refused.value
    ? 'Explique o motivo em linguagem simples e informe a quem recorrer. O texto vai íntegro ao titular.'
    : 'Diga o que foi feito, o que foi mantido e por quê. O texto vai íntegro ao titular e fica anexo à requisição.',
)

const outcomeError = computed(() =>
  attempted.value && outcome.value === null
    ? 'Escolha o desfecho para finalizar o atendimento.'
    : 'O desfecho aparece na requisição do titular e nos relatórios de conformidade.',
)

const textError = computed(() =>
  attempted.value && !textOk.value ? `Escreva pelo menos ${ANSWER_MIN_LENGTH} caracteres.` : undefined,
)

const basisError = computed(() =>
  attempted.value && !basisOk.value ? 'Campo obrigatório para o desfecho recusado.' : undefined,
)

// Trocar de desfecho para fora da recusa apaga um fundamento que deixou de
// fazer sentido — enviá-lo escondido seria pior.
watch(refused, (isRefused) => {
  if (!isRefused) legalBasis.value = ''
})

async function submit() {
  if (sending) return

  attempted.value = true
  if (!isComplete.value || outcome.value === null) {
    await nextTick()
    summary.value?.focus()
    return
  }

  emit('submit', {
    outcome: outcome.value,
    text: text.value,
    legalBasis: refused.value ? legalBasis.value : undefined,
  })
}
</script>

<template>
  <BasePanel
    eyebrow="Finalizar atendimento · RF013"
    title="Resposta ao titular"
    tone="brand"
  >
    <template #action>
      <button
        type="button"
        class="flex size-10 items-center justify-center border border-line bg-surface text-xl text-ink-soft hover:border-brand"
        :disabled="sending"
        @click="$emit('close')"
      >
        <span aria-hidden="true">×</span>
        <span class="sr-only">Fechar a finalização</span>
      </button>
    </template>

    <form
      novalidate
      @submit.prevent="submit"
    >
      <div class="flex flex-col gap-6 px-[22px] pb-6 pt-[22px]">
        <div
          v-if="attempted && !isComplete"
          ref="summary"
          tabindex="-1"
        >
          <BaseAlert title="Ainda não é possível finalizar o atendimento">
            <p>
              A resposta vai íntegra ao titular e entra na trilha de auditoria: confira o desfecho,
              o texto e a confirmação antes de enviar.
            </p>
          </BaseAlert>
        </div>

        <fieldset class="flex flex-col gap-3">
          <legend class="text-base font-semibold text-ink">
            Desfecho do pedido
            <span
              class="text-danger"
              aria-hidden="true"
            >*</span>
          </legend>
          <div class="grid gap-2.5 md:grid-cols-3">
            <label
              v-for="option in outcomes"
              :key="option.value"
              class="flex cursor-pointer items-start gap-2.5 px-4 py-3.5"
              :class="
                outcome === option.value
                  ? 'border-2 border-brand bg-brand-wash'
                  : attempted && outcome === null
                    ? 'border-2 border-danger bg-surface'
                    : 'border border-field-line bg-surface'
              "
            >
              <input
                v-model="outcome"
                type="radio"
                :name="groupName"
                :value="option.value"
                :disabled="sending"
                class="mt-0.5 size-[18px] shrink-0 accent-brand"
              >
              <span class="flex flex-col gap-1">
                <span class="text-[15px] font-semibold text-ink">
                  {{ REQUEST_OUTCOME_LABELS[option.value] }}
                </span>
                <span class="text-[13px] leading-normal text-ink-soft">{{ option.detail }}</span>
              </span>
            </label>
          </div>
          <p
            class="text-[13px] leading-normal"
            :class="attempted && outcome === null ? 'text-danger' : 'text-ink-muted'"
          >
            {{ outcomeError }}
          </p>
        </fieldset>

        <BaseTextarea
          v-model="text"
          :label="textLabel"
          :description="textDescription"
          required
          :rows="6"
          :maxlength="ANSWER_MAX_LENGTH"
          :disabled="sending"
          :error="textError"
          :hint="`Mínimo de ${ANSWER_MIN_LENGTH} caracteres. Evite citar artigo sem explicar o efeito prático.`"
          placeholder="Escreva em linguagem simples: o que foi feito, o que foi mantido e por quê."
        />

        <div
          v-if="refused"
          class="flex flex-col gap-1.5"
        >
          <BaseSelect
            v-model="legalBasis"
            label="Fundamento legal da recusa *"
            :options="groundOptions"
            :disabled="sending"
          />
          <p
            class="text-[13px] leading-normal"
            :class="basisError ? 'text-danger' : 'text-ink-muted'"
          >
            {{ basisError ?? 'O fundamento é citado na resposta e no relatório à ANPD.' }}
          </p>
        </div>

        <AttachmentPicker
          v-model="attachments"
          label="Anexos da resposta"
          prompt="Anexar arquivos à resposta"
          empty-hint="Nenhum arquivo anexado. A resposta pode ser enviada apenas com o texto."
          :accept="ANSWER_ATTACHMENT_ACCEPT"
          :rule="ANSWER_ATTACHMENT_RULE"
          :max-bytes="ANSWER_ATTACHMENT_MAX_BYTES"
          :disabled="sending"
        />

        <label
          :for="acknowledgeId"
          class="flex cursor-pointer items-start gap-3 px-4 py-3.5"
          :class="
            attempted && !acknowledged
              ? 'border-2 border-danger bg-danger-wash'
              : 'border border-line bg-surface-muted'
          "
        >
          <input
            :id="acknowledgeId"
            v-model="acknowledged"
            type="checkbox"
            :disabled="sending"
            class="mt-0.5 size-5 shrink-0 accent-brand"
          >
          <span class="flex flex-col gap-1">
            <span class="text-[15px] font-semibold text-ink">
              Confirmo que esta resposta encerra o atendimento
            </span>
            <span class="text-sm leading-normal text-ink-soft">
              O titular é notificado na hora (RF007) e a contagem do prazo para. Correções
              posteriores só por nova requisição.
            </span>
          </span>
        </label>
      </div>

      <div
        class="flex flex-wrap items-center justify-between gap-4 border-t border-line bg-surface-subtle px-[22px] pb-6 pt-5"
      >
        <p class="max-w-[52ch] text-[13px] leading-normal text-ink-muted">
          A finalização entra na trilha de auditoria com autor, data, hora, desfecho e o texto
          enviado.
        </p>
        <div class="flex flex-wrap items-center gap-2.5">
          <BaseButton
            variant="secondary"
            :disabled="sending"
            @click="$emit('close')"
          >
            Salvar rascunho
          </BaseButton>
          <BaseButton
            type="submit"
            :busy="sending"
          >
            {{ sending ? 'Finalizando…' : 'Finalizar atendimento' }}
          </BaseButton>
        </div>
      </div>
    </form>
  </BasePanel>
</template>
