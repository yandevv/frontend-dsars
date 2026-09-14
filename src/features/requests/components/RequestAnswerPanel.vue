<script setup lang="ts">
import { computed, nextTick, ref, useId, useTemplateRef } from 'vue'

import AttachmentPicker from '@/features/requests/components/AttachmentPicker.vue'
import BaseAlert from '@/shared/ui/BaseAlert.vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import BasePanel from '@/shared/ui/BasePanel.vue'
import BaseTextarea from '@/shared/ui/BaseTextarea.vue'
import {
  ANSWER_ATTACHMENT_RULE,
  ANSWER_MAX_LENGTH,
  ANSWER_MIN_LENGTH,
} from '@/features/requests/constants/requestPolicy'
import type { RequestAttachment } from '@/features/requests/types/request'

/**
 * Finalização do atendimento (RF007 / RN028).
 *
 * O parecer conclusivo é uma mensagem ao titular, e vai sempre acompanhado do
 * resultado entregue: sem anexo não há o que comprovar diante do titular ou
 * da autoridade.
 */
const { sending = false } = defineProps<{ sending?: boolean }>()

const emit = defineEmits<{
  close: []
  submit: [{ text: string; attachments: RequestAttachment[] }]
}>()

const text = ref('')
const attachments = ref<RequestAttachment[]>([])
const acknowledged = ref(false)
const attempted = ref(false)
const summary = useTemplateRef<HTMLElement>('summary')

const acknowledgeId = useId()

const textOk = computed(() => text.value.trim().length >= ANSWER_MIN_LENGTH)
const attachmentsOk = computed(() => attachments.value.length > 0)
const isComplete = computed(() => textOk.value && attachmentsOk.value && acknowledged.value)

const textError = computed(() =>
  attempted.value && !textOk.value ? 'Escreva o parecer que vai ao titular.' : undefined,
)

async function submit() {
  if (sending) return

  attempted.value = true
  if (!isComplete.value) {
    await nextTick()
    summary.value?.focus()
    return
  }

  emit('submit', { text: text.value, attachments: [...attachments.value] })
}
</script>

<template>
  <BasePanel
    eyebrow="Finalizar atendimento"
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
              A resposta vai íntegra ao titular e entra na trilha de auditoria: confira o texto,
              o resultado anexado e a confirmação antes de enviar.
            </p>
          </BaseAlert>
        </div>

        <BaseTextarea
          v-model="text"
          label="Parecer ao titular"
          description="Diga o que foi feito, o que foi mantido e por quê. O texto vai íntegro ao titular e fica na conversa da requisição."
          required
          :rows="6"
          :maxlength="ANSWER_MAX_LENGTH"
          :disabled="sending"
          :error="textError"
          hint="Evite citar artigo sem explicar o efeito prático."
          placeholder="Escreva em linguagem simples: o que foi feito, o que foi mantido e por quê."
        />

        <AttachmentPicker
          v-model="attachments"
          label="Anexos da resposta"
          prompt="Anexar arquivos à resposta"
          :optional="false"
          empty-hint="Anexe o resultado entregue ao titular: relatório, comprovante de eliminação ou arquivo de portabilidade."
          :rule="ANSWER_ATTACHMENT_RULE"
          :disabled="sending"
        />
        <p
          v-if="attempted && !attachmentsOk"
          class="-mt-4 text-[13px] leading-normal text-danger"
        >
          Anexe pelo menos um arquivo com o resultado do atendimento.
        </p>

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
              O titular é notificado na hora e a contagem do prazo para. Correções
              posteriores só por nova requisição.
            </span>
          </span>
        </label>
      </div>

      <div
        class="flex flex-wrap items-center justify-between gap-4 border-t border-line bg-surface-subtle px-[22px] pb-6 pt-5"
      >
        <p class="max-w-[52ch] text-[13px] leading-normal text-ink-muted">
          A finalização entra na trilha de auditoria com autor, data, hora e o texto enviado.
        </p>
        <div class="flex flex-wrap items-center gap-2.5">
          <BaseButton
            variant="secondary"
            :disabled="sending"
            @click="$emit('close')"
          >
            Voltar
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
