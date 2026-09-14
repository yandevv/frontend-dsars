<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'

import AccessFormatPicker from '@/features/requests/components/AccessFormatPicker.vue'
import AttachmentPicker from '@/features/requests/components/AttachmentPicker.vue'
import BaseAlert from '@/shared/ui/BaseAlert.vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import BaseCheckbox from '@/shared/ui/BaseCheckbox.vue'
import BaseField from '@/shared/ui/BaseField.vue'
import BaseTextarea from '@/shared/ui/BaseTextarea.vue'
import RightPicker from '@/features/requests/components/RightPicker.vue'
import {
  DESCRIPTION_MAX_LENGTH,
  DESCRIPTION_MIN_LENGTH,
} from '@/features/requests/constants/requestPolicy'
import { ORIGIN_CHANNELS } from '@/features/requests/constants/originChannels'
import { registerOnBehalf } from '@/features/requests/services/requestService'
import { needsAccessFormat } from '@/features/requests/utils/responseDeadline'
import { messageOf } from '@/shared/api/ApiError'
import type {
  AccessFormat,
  OnBehalfReceipt,
  OriginChannel,
  RequestAttachment,
} from '@/features/requests/types/request'

/**
 * Registro de uma requisição em nome do titular (RF004, variante da encarregada).
 *
 * O mesmo pedido do formulário do titular, com duas seções antes: quem pediu e
 * por onde o pedido chegou. No computador as três seções ficam na mesma página;
 * no celular viram três passos, cada um conferido antes de seguir.
 *
 * O titular é identificado pelo e-mail da conta: é ela que acompanha o pedido
 * e recebe os avisos, e o servidor recusa endereço sem conta ativa e
 * confirmada.
 */
const emit = defineEmits<{ registered: [OnBehalfReceipt] }>()

/** O direito pertence à tela: a coluna de apoio calcula o prazo com ele. */
const rightNumeral = defineModel<string>('right', { required: true })
const accessFormat = defineModel<AccessFormat | ''>('accessFormat', { default: '' })

// O formato só existe no acesso aos dados; trocar de direito o apaga.
watch(rightNumeral, (numeral) => {
  if (!needsAccessFormat(numeral)) accessFormat.value = ''
})

// ── Titular ──────────────────────────────────────────────────────────────────
const subjectEmail = ref('')
const identityVerified = ref(false)

const subjectOk = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(subjectEmail.value.trim()))

// ── Origem ───────────────────────────────────────────────────────────────────
const channel = ref<OriginChannel | null>(null)
const reference = ref('')

// ── Pedido ───────────────────────────────────────────────────────────────────
const description = ref('')
const attachments = ref<RequestAttachment[]>([])

const rightOk = computed(() => rightNumeral.value !== '')
const formatOk = computed(() => !needsAccessFormat(rightNumeral.value) || accessFormat.value !== '')
const descriptionOk = computed(() => description.value.trim().length >= DESCRIPTION_MIN_LENGTH)

// ── Passos e validação ───────────────────────────────────────────────────────
type Step = 1 | 2 | 3

const STEP_TITLES: Record<Step, string> = { 1: 'Titular', 2: 'Origem', 3: 'Pedido' }

const step = ref<Step>(1)
/** Passos já conferidos: é a partir deles que os erros aparecem, no celular. */
const reviewed = ref<Set<Step>>(new Set())
const status = ref<'idle' | 'sending'>('idle')
const failure = ref('')
const summary = useTemplateRef<HTMLElement>('summary')

const sending = computed(() => status.value === 'sending')

const stepOk = computed<Record<Step, boolean>>(() => ({
  1: subjectOk.value && identityVerified.value,
  2: channel.value !== null,
  3: rightOk.value && formatOk.value && descriptionOk.value,
}))

const isComplete = computed(() => stepOk.value[1] && stepOk.value[2] && stepOk.value[3])

const show = (n: Step) => reviewed.value.has(n)

const emailError = computed(() =>
  show(1) && !subjectOk.value
    ? 'Informe o e-mail da conta do titular, no formato nome@dominio.com.br.'
    : undefined,
)

const identityError = computed(() =>
  show(1) && !identityVerified.value
    ? 'Confirme a verificação de identidade para registrar.'
    : undefined,
)

const channelError = computed(() =>
  show(2) && channel.value === null ? 'Informe por onde o pedido chegou.' : undefined,
)

const descriptionError = computed(() =>
  show(3) && !descriptionOk.value
    ? `Escreva pelo menos ${DESCRIPTION_MIN_LENGTH} caracteres.`
    : undefined,
)

const missing = computed(() =>
  [
    subjectOk.value ? null : 'informe o e-mail da conta do titular',
    identityVerified.value ? null : 'confirme a verificação de identidade',
    channel.value ? null : 'informe o canal de origem',
    rightOk.value ? null : 'escolha o direito exercido',
    formatOk.value ? null : 'escolha o formato do acesso',
    descriptionOk.value ? null : 'descreva o pedido',
  ].filter((item): item is string => item !== null),
)

const missingText = computed(() => {
  const text = missing.value.join('; ')
  return text.charAt(0).toUpperCase() + text.slice(1) + '.'
})

const submitHint = computed(() => {
  if (sending.value) return 'Aguarde: estamos gerando o protocolo e o identificador.'
  if (reviewed.value.has(3) && !isComplete.value) {
    return 'Revise os campos marcados acima para concluir o registro.'
  }
  return 'O registro fica vinculado à sua conta e não pode ser apagado, apenas respondido ou cancelado pelo titular.'
})

async function focusSummary() {
  await nextTick()
  summary.value?.focus()
}

/** No celular: confere o passo atual antes de seguir para o próximo. */
function advance() {
  reviewed.value = new Set([...reviewed.value, step.value])
  if (!stepOk.value[step.value]) return
  step.value = (step.value + 1) as Step
  window.scrollTo?.({ top: 0 })
}

function back() {
  if (step.value > 1) step.value = (step.value - 1) as Step
}

async function submit() {
  if (sending.value) return

  reviewed.value = new Set<Step>([1, 2, 3])
  failure.value = ''

  if (!isComplete.value) {
    // No celular, volta ao primeiro passo com pendência; o resumo diz o resto.
    const firstPending = ([1, 2, 3] as Step[]).find((n) => !stepOk.value[n])
    if (firstPending) step.value = firstPending
    await focusSummary()
    return
  }

  status.value = 'sending'
  try {
    const receipt = await registerOnBehalf({
      subjectEmail: subjectEmail.value,
      identityVerified: identityVerified.value,
      channel: channel.value,
      reference: reference.value,
      rightNumeral: rightNumeral.value,
      accessFormat: accessFormat.value || undefined,
      description: description.value,
      attachments: attachments.value,
    })
    emit('registered', receipt)
  } catch (error) {
    status.value = 'idle'
    failure.value = messageOf(error)
    await focusSummary()
  }
}

/** Classes da seção: no celular só o passo atual aparece. */
function stepClass(n: Step) {
  return step.value === n ? 'flex' : 'hidden lg:flex'
}
</script>

<template>
  <form
    class="flex flex-col gap-7"
    novalidate
    @submit.prevent="submit"
  >
    <div class="flex flex-col gap-2">
      <h1 class="font-serif text-[26px] font-semibold leading-[1.15] text-ink sm:text-[34px]">
        Registrar requisição em nome do titular
      </h1>
      <p class="max-w-[70ch] text-base leading-relaxed text-ink-body">
        Para pedidos que chegaram fora da plataforma — balcão, telefone, e-mail, carta ou outro
        canal. O registro entra na fila como qualquer outro e fica vinculado à sua conta.
      </p>
      <p
        class="font-label text-[12px] font-semibold uppercase tracking-[0.07em] text-ink-soft lg:hidden"
        aria-live="polite"
      >
        Passo {{ step }} de 3 · {{ STEP_TITLES[step] }}
      </p>
    </div>

    <div
      v-if="failure || (reviewed.has(3) && !isComplete)"
      ref="summary"
      tabindex="-1"
    >
      <BaseAlert
        v-if="failure"
        title="Não foi possível registrar a requisição"
      >
        <p>{{ failure }}</p>
      </BaseAlert>
      <BaseAlert
        v-else
        title="Revise os campos marcados para registrar"
      >
        <p>{{ missingText }}</p>
      </BaseAlert>
    </div>

    <!-- 1. Titular -->
    <section
      class="flex-col gap-5 border border-line px-5 py-[22px] sm:px-6"
      :class="stepClass(1)"
      aria-labelledby="titulo-titular"
    >
      <h2
        id="titulo-titular"
        class="font-serif text-[22px] font-semibold text-ink"
      >
        1. Titular do pedido
      </h2>

      <BaseField
        v-model="subjectEmail"
        label="E-mail da conta do titular"
        type="email"
        required
        autocomplete="off"
        placeholder="titular@exemplo.com.br"
        :disabled="sending"
        :error="emailError"
        hint="O titular precisa ter conta no portal, com o e-mail confirmado: é por ela que acompanha o pedido e recebe a resposta."
      />

      <div
        class="px-4 py-3.5"
        :class="identityError ? '' : 'border border-line-soft bg-surface-muted'"
      >
        <BaseCheckbox
          v-model="identityVerified"
          :error="identityError"
          :disabled="sending"
        >
          <span class="text-[15px] font-semibold text-ink">
            Confirmo que verifiquei a identidade de quem fez o pedido
            <span
              class="text-danger"
              aria-hidden="true"
            >*</span>
          </span>
          <span class="text-sm leading-relaxed text-ink-soft">
            Documento apresentado no balcão, confirmação por telefone com dados cadastrais ou e-mail
            vindo do endereço cadastrado. A forma de verificação vai na descrição.
          </span>
        </BaseCheckbox>
      </div>

      <BaseButton
        block
        class="lg:hidden"
        @click="advance"
      >
        Continuar para a origem
      </BaseButton>
    </section>

    <!-- 2. Origem -->
    <section
      class="flex-col gap-5 border border-line px-5 py-[22px] sm:px-6"
      :class="stepClass(2)"
      aria-labelledby="titulo-origem"
    >
      <h2
        id="titulo-origem"
        class="font-serif text-[22px] font-semibold text-ink"
      >
        2. Origem do pedido
      </h2>

      <fieldset
        class="flex flex-col gap-3"
        :aria-describedby="channelError ? 'canal-erro' : 'canal-auxilio'"
      >
        <legend class="mb-3 text-base font-semibold text-ink">
          Canal de origem
          <span
            class="text-danger"
            aria-hidden="true"
          >*</span>
        </legend>
        <div class="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          <label
            v-for="option in ORIGIN_CHANNELS"
            :key="option.id"
            class="flex cursor-pointer items-start gap-3 px-4 py-3"
            :class="
              channel === option.id
                ? 'border-2 border-brand bg-brand-wash'
                : channelError
                  ? 'border border-danger-line bg-surface'
                  : 'border border-field-line bg-surface'
            "
          >
            <input
              v-model="channel"
              type="radio"
              name="canal-origem"
              :value="option.id"
              class="mt-0.5 size-5 shrink-0 accent-brand"
              :disabled="sending"
            >
            <span class="flex flex-col gap-0.5">
              <span class="text-[15px] font-semibold text-ink">{{ option.label }}</span>
              <span class="text-[13px] leading-snug text-ink-muted">{{ option.detail }}</span>
            </span>
          </label>
        </div>
        <p
          v-if="channelError"
          id="canal-erro"
          class="text-[13px] text-danger"
        >
          {{ channelError }}
        </p>
        <p
          v-else
          id="canal-auxilio"
          class="text-[13px] text-ink-muted"
        >
          O canal aparece na requisição do titular e nos relatórios de origem.
        </p>
      </fieldset>

      <BaseField
        v-model="reference"
        label="Referência do canal (opcional)"
        autocomplete="off"
        placeholder="Ex.: atendimento 4471, carta nº 219/2026"
        :disabled="sending"
        hint="Liga este registro ao documento original guardado fora da plataforma."
      />

      <div class="flex flex-col-reverse gap-2.5 lg:hidden">
        <BaseButton
          variant="secondary"
          block
          @click="back"
        >
          Voltar ao titular
        </BaseButton>
        <BaseButton
          block
          @click="advance"
        >
          Continuar para o pedido
        </BaseButton>
      </div>
    </section>

    <!-- 3. Pedido -->
    <section
      class="flex-col gap-6 border border-line px-5 py-[22px] sm:px-6"
      :class="stepClass(3)"
      aria-labelledby="titulo-pedido"
    >
      <h2
        id="titulo-pedido"
        class="font-serif text-[22px] font-semibold text-ink"
      >
        3. Pedido
      </h2>

      <RightPicker
        v-model="rightNumeral"
        :invalid="show(3) && !rightOk"
        :disabled="sending"
        description="Um direito por requisição, como no formulário do titular. Se o pedido recebido cobre dois direitos, registre duas requisições e cite a mesma referência de canal."
      />

      <AccessFormatPicker
        v-if="needsAccessFormat(rightNumeral)"
        v-model="accessFormat"
        legend="Como o titular quer receber os dados?"
        :invalid="show(3) && !formatOk"
        :disabled="sending"
      />

      <BaseTextarea
        v-model="description"
        label="Descrição do pedido"
        required
        :rows="6"
        :maxlength="DESCRIPTION_MAX_LENGTH"
        :disabled="sending"
        description="Transcreva o que o titular pediu, sem interpretar. Registre também como a identidade foi verificada e o que foi dito no atendimento."
        :hint="`Mínimo de ${DESCRIPTION_MIN_LENGTH} caracteres. Use as palavras do titular sempre que possível.`"
        :error="descriptionError"
      />

      <AttachmentPicker
        v-model="attachments"
        label="Documento recebido"
        prompt="Digitalização da carta, do formulário assinado ou do e-mail"
        empty-hint="Guardar o documento original junto da requisição é o que sustenta o registro por terceiro em auditoria."
        :disabled="sending"
      />
    </section>

    <div
      class="flex-col gap-3 border-t border-line pt-6"
      :class="step === 3 ? 'flex' : 'hidden lg:flex'"
    >
      <div class="flex flex-col-reverse gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
        <BaseButton
          variant="secondary"
          class="lg:hidden"
          block
          :disabled="sending"
          @click="back"
        >
          Voltar à origem
        </BaseButton>
        <div class="hidden lg:block">
          <BaseButton
            :to="{ name: 'request-queue' }"
            variant="secondary"
          >
            Cancelar
          </BaseButton>
        </div>
        <BaseButton
          type="submit"
          :busy="sending"
          class="sm:order-first"
        >
          {{ sending ? 'Registrando…' : 'Registrar requisição' }}
        </BaseButton>
      </div>
      <p
        class="text-sm leading-normal"
        :class="reviewed.has(3) && !isComplete && !sending ? 'text-danger' : 'text-ink-soft'"
      >
        {{ submitHint }}
      </p>
    </div>
  </form>
</template>
