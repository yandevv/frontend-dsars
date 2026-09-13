<script setup lang="ts">
import { computed, nextTick, reactive, ref, useTemplateRef, watch } from 'vue'

import AccessFormatPicker from '@/features/requests/components/AccessFormatPicker.vue'
import AttachmentPicker from '@/features/requests/components/AttachmentPicker.vue'
import BaseAlert from '@/shared/ui/BaseAlert.vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import BaseTextarea from '@/shared/ui/BaseTextarea.vue'
import RightPicker from '@/features/requests/components/RightPicker.vue'
import {
  DESCRIPTION_MAX_LENGTH,
  DESCRIPTION_MIN_LENGTH,
} from '@/features/requests/constants/requestPolicy'
import {
  dueAtFor,
  formatDue,
  isImmediate,
  needsAccessFormat,
} from '@/features/requests/utils/responseDeadline'
import { createRequest } from '@/features/requests/services/requestService'
import type { Account } from '@/features/auth/types/auth'
import type {
  AccessFormat,
  RequestAttachment,
  RequestReceipt,
} from '@/features/requests/types/request'

/**
 * Abertura de uma requisição de titular (RF004).
 *
 * Um direito por requisição, por decisão de produto e não por limitação da
 * tela: pedidos diferentes têm prazos, desfechos e fundamentos diferentes, e
 * juntá-los num protocolo só tornaria impossível dizer qual deles foi atendido.
 */
const { account } = defineProps<{ account: Account }>()

/** A tela troca o formulário pelo comprovante; quem manda é a view. */
const emit = defineEmits<{ registered: [RequestReceipt] }>()

/**
 * O direito escolhido pertence à tela, não ao formulário: a coluna de apoio
 * mostra o prazo desse direito ao lado, e ela é irmã do formulário, não filha.
 */
const rightNumeral = defineModel<string>('right', { required: true })

/** O formato do acesso decide o prazo, e o prazo aparece na coluna ao lado. */
const accessFormat = defineModel<AccessFormat | ''>('accessFormat', { default: '' })

// Trocar de direito apaga o formato: ele só tem sentido no acesso aos dados.
watch(rightNumeral, (numeral) => {
  if (!needsAccessFormat(numeral)) accessFormat.value = ''
})

const form = reactive({
  description: '',
  attachments: [] as RequestAttachment[],
})

const attempted = ref(false)
const status = ref<'idle' | 'sending'>('idle')
const failure = ref(false)
const summary = useTemplateRef<HTMLElement>('summary')

const sending = computed(() => status.value === 'sending')
const rightChosen = computed(() => rightNumeral.value !== '')
const descriptionOk = computed(() => form.description.trim().length >= DESCRIPTION_MIN_LENGTH)
const formatOk = computed(() => !needsAccessFormat(rightNumeral.value) || accessFormat.value !== '')
const isComplete = computed(() => rightChosen.value && formatOk.value && descriptionOk.value)

const missing = computed(() =>
  [
    rightChosen.value ? null : 'Escolha o direito exercido',
    formatOk.value ? null : 'escolha o formato do acesso',
    descriptionOk.value ? null : 'descreva o pedido',
  ].filter((item): item is string => item !== null),
)

/** "a", "a e b", "a, b e c". */
const missingText = computed(() => {
  const items = missing.value
  const text =
    items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} e ${items[items.length - 1]}`
  return text.charAt(0).toUpperCase() + text.slice(1)
})

const summaryTitle = computed(
  () =>
    ({ 1: 'Falta um campo obrigatório', 2: 'Faltam dois campos obrigatórios' })[
      missing.value.length
    ] ?? 'Faltam três campos obrigatórios',
)

const descriptionError = computed(() => {
  if (!attempted.value || descriptionOk.value) return undefined
  return `Descreva com um pouco mais de detalhe — mínimo de ${DESCRIPTION_MIN_LENGTH} caracteres.`
})

const format = computed(() => accessFormat.value || undefined)
const dueAt = computed(() => dueAtFor(new Date().toISOString(), rightNumeral.value, format.value))

const submitHint = computed(() => {
  if (sending.value) {
    return 'Aguarde: estamos gerando o protocolo e o identificador desta requisição.'
  }
  if (isComplete.value) {
    const immediate = isImmediate(rightNumeral.value, format.value)
    return immediate
      ? `Ao enviar, geramos protocolo e identificador. Este pedido tem resposta imediata: até ${formatDue(dueAt.value, true)}.`
      : `Ao enviar, geramos protocolo e identificador e começamos a contar o prazo até ${formatDue(dueAt.value, false)}.`
  }
  return 'Direito exercido e descrição são obrigatórios. Os anexos são opcionais.'
})

async function submit() {
  if (sending.value) return

  attempted.value = true
  failure.value = false

  if (!isComplete.value) {
    await nextTick()
    summary.value?.focus()
    return
  }

  status.value = 'sending'
  try {
    const receipt = await createRequest(
      {
        rightNumeral: rightNumeral.value,
        accessFormat: format.value,
        description: form.description,
        attachments: form.attachments,
      },
      { name: account.name, email: account.email, verifiedAt: new Date().toISOString() },
    )
    emit('registered', receipt)
  } catch {
    status.value = 'idle'
    failure.value = true
    await nextTick()
    summary.value?.focus()
  }
}
</script>

<template>
  <form
    class="flex flex-col gap-7"
    novalidate
    @submit.prevent="submit"
  >
    <div class="flex flex-col gap-2">
      <h1 class="font-serif text-[34px] font-semibold leading-[1.15] text-ink">
        Nova requisição
      </h1>
      <p class="max-w-[64ch] text-base leading-relaxed text-ink-body">
        O pedido vai para a pessoa encarregada de proteção de dados desta organização. Escolha um
        direito por requisição: pedidos diferentes têm prazos e respostas diferentes.
      </p>
    </div>

    <div
      v-if="failure || (attempted && !isComplete)"
      ref="summary"
      tabindex="-1"
    >
      <BaseAlert
        v-if="failure"
        title="Não foi possível registrar a requisição"
      >
        <p>Algo falhou no caminho e nada foi gravado. Tente enviar de novo em alguns instantes.</p>
      </BaseAlert>
      <BaseAlert
        v-else
        :title="summaryTitle"
      >
        <p>{{ missingText }} para enviar.</p>
      </BaseAlert>
    </div>

    <RightPicker
      v-model="rightNumeral"
      :invalid="attempted && !rightChosen"
    />

    <AccessFormatPicker
      v-if="needsAccessFormat(rightNumeral)"
      v-model="accessFormat"
      :invalid="attempted && !formatOk"
      :disabled="sending"
    />

    <BaseTextarea
      v-model="form.description"
      label="Descrição do pedido"
      required
      :rows="6"
      :maxlength="DESCRIPTION_MAX_LENGTH"
      :disabled="sending"
      description="Diga o que você precisa e, se souber, a que atendimento, unidade ou período os dados
        se referem. Isso reduz a chance de pedirmos informação complementar depois."
      :hint="`Mínimo de ${DESCRIPTION_MIN_LENGTH} caracteres. Evite incluir dados de outras pessoas.`"
      :error="descriptionError"
      placeholder="Ex.: quero a cópia dos exames laboratoriais realizados na unidade Centro entre janeiro e junho de 2026."
    />

    <AttachmentPicker
      v-model="form.attachments"
      :disabled="sending"
    />

    <div class="flex flex-col gap-3 border-t border-line pt-6">
      <div class="flex flex-wrap items-center gap-3">
        <BaseButton
          type="submit"
          :busy="sending"
        >
          {{ sending ? 'Registrando requisição…' : 'Enviar requisição' }}
        </BaseButton>
        <BaseButton
          :to="{ name: 'my-requests' }"
          variant="secondary"
        >
          Cancelar
        </BaseButton>
      </div>
      <p class="text-sm leading-normal text-ink-soft">
        {{ submitHint }}
      </p>
    </div>
  </form>
</template>
