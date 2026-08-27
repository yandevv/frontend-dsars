<script setup lang="ts">
import { computed, ref, useId, useTemplateRef } from 'vue'

import {
  ATTACHMENT_ACCEPT,
  ATTACHMENT_MAX_BYTES,
  ATTACHMENT_MAX_COUNT,
  ATTACHMENT_RULE,
} from '@/features/requests/constants/requestPolicy'
import { formatBytes } from '@/shared/utils/bytes'
import type { RequestAttachment } from '@/features/requests/types/request'

/**
 * Anexos opcionais do pedido.
 *
 * A recusa de um arquivo é local de propósito: extensão e tamanho dão para
 * conferir antes de gastar a conexão de quem está enviando. Isso não substitui
 * a conferência no servidor — o que o navegador aceita não é o que vale.
 */
const {
  disabled = false,
  label = 'Anexos',
  optional = true,
  prompt = 'Escolha os arquivos do seu aparelho',
  accept = ATTACHMENT_ACCEPT,
  rule = ATTACHMENT_RULE,
  maxBytes = ATTACHMENT_MAX_BYTES,
  maxCount = ATTACHMENT_MAX_COUNT,
  emptyHint = 'Anexos ajudam a comprovar identidade ou a localizar o atendimento, mas não são obrigatórios.',
} = defineProps<{
  disabled?: boolean
  label?: string
  optional?: boolean
  prompt?: string
  /** Extensões aceitas, no formato do atributo `accept`. */
  accept?: string
  /** A regra em palavras, para quem lê antes de escolher o arquivo. */
  rule?: string
  maxBytes?: number
  maxCount?: number
  /** O que dizer enquanto nada foi anexado. */
  emptyHint?: string
}>()

const model = defineModel<RequestAttachment[]>({ required: true })

const inputId = useId()
const input = useTemplateRef<HTMLInputElement>('input')
const rejected = ref<{ name: string; reason: string } | null>(null)

const accepted = computed(() =>
  accept.split(',').map((extension) => extension.trim().toLowerCase()),
)

const maxMegabytes = computed(() => Math.round(maxBytes / (1024 * 1024)))

function reject(name: string, reason: string) {
  rejected.value = { name, reason }
}

function onFiles(event: Event) {
  const target = event.target as HTMLInputElement
  rejected.value = null

  for (const file of Array.from(target.files ?? [])) {
    const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()

    if (!accepted.value.includes(extension)) {
      reject(
        file.name,
        `Arquivos ${extension || 'sem extensão'} não são aceitos. Envie os documentos em ${accept.replace(/\./g, '').toUpperCase().split(',').join(', ')}, um por arquivo.`,
      )
      continue
    }
    if (file.size > maxBytes) {
      reject(
        file.name,
        `O arquivo tem ${formatBytes(file.size)} e o limite é de ${maxMegabytes.value} MB por anexo.`,
      )
      continue
    }
    if (model.value.length >= maxCount) {
      reject(
        file.name,
        `Limite de ${maxCount} arquivos atingido. Remova um anexo para incluir outro.`,
      )
      continue
    }

    model.value = [...model.value, { name: file.name, meta: formatBytes(file.size) }]
  }

  // Zerar permite reescolher o mesmo arquivo depois de removê-lo da lista.
  target.value = ''
}

function remove(index: number) {
  model.value = model.value.filter((_, position) => position !== index)
  rejected.value = null
}

const hint = computed(() => {
  if (model.value.length === 0) return emptyHint
  return `${model.value.length} de ${maxCount} arquivos anexados. O envio continua possível sem anexos.`
})
</script>

<template>
  <div class="flex flex-col gap-2.5">
    <p class="text-base font-semibold text-ink">
      {{ label }}
      <span
        v-if="optional"
        class="text-sm font-normal text-ink-muted"
      >(opcional)</span>
    </p>

    <div
      class="flex flex-wrap items-center justify-between gap-5 border border-dashed border-field-line bg-surface-muted px-5 py-[22px]"
    >
      <span class="flex flex-col gap-0.5">
        <span class="text-[15px] font-semibold text-ink">{{ prompt }}</span>
        <span class="max-w-[56ch] text-sm text-ink-soft">{{ rule }}</span>
      </span>

      <label
        :for="inputId"
        class="cursor-pointer border border-field-line bg-surface px-5 py-[13px] text-[15px] font-medium text-ink hover:border-brand hover:text-brand"
        :class="disabled ? 'pointer-events-none opacity-55' : ''"
      >
        Escolher arquivo
      </label>
      <input
        :id="inputId"
        ref="input"
        type="file"
        multiple
        :accept="accept"
        :disabled="disabled"
        class="sr-only"
        @change="onFiles"
      >
    </div>

    <div
      v-if="rejected"
      role="alert"
      class="flex flex-col gap-1.5 border-2 border-danger bg-danger-wash px-4 py-3.5"
    >
      <p class="text-[15px] font-semibold text-danger-strong">
        {{ rejected.name }} não foi anexado
      </p>
      <p class="text-sm leading-normal text-danger-body">
        {{ rejected.reason }}
      </p>
    </div>

    <ul
      v-if="model.length > 0"
      class="flex flex-col gap-2"
    >
      <li
        v-for="(attachment, index) in model"
        :key="attachment.name"
        class="flex items-center justify-between gap-4 border border-line px-4 py-[13px]"
      >
        <span class="flex items-baseline gap-3">
          <span class="text-[15px] font-medium text-ink">{{ attachment.name }}</span>
          <span class="text-[13px] text-ink-muted">{{ attachment.meta }}</span>
        </span>
        <button
          type="button"
          :disabled="disabled"
          class="py-1 text-sm text-danger underline hover:text-danger-strong"
          @click="remove(index)"
        >
          Remover<span class="sr-only"> {{ attachment.name }}</span>
        </button>
      </li>
    </ul>

    <p class="text-[13px] leading-normal text-ink-muted">
      {{ hint }}
    </p>
  </div>
</template>
