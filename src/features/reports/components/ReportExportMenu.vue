<script setup lang="ts">
import { onScopeDispose, ref, useTemplateRef } from 'vue'

import type { ExportFormat } from '@/features/reports/types/report'

/**
 * As três formas de levar o relatório embora.
 *
 * A exportação carrega o recorte atual, não a base inteira: quem exporta está
 * levando o que está vendo, e o cabeçalho do menu repete o recorte para que
 * ninguém descubra isso depois, olhando o arquivo.
 */
const { scope } = defineProps<{ scope: string }>()

const emit = defineEmits<{ choose: [ExportFormat] }>()

const open = ref(false)
const container = useTemplateRef<HTMLElement>('container')

const formats: { id: ExportFormat; title: string; detail: string }[] = [
  {
    id: 'csv',
    title: 'Planilha CSV',
    detail: 'Os indicadores do recorte, para cruzar com outras bases.',
  },
  {
    id: 'pdf',
    title: 'Relatório em PDF',
    detail: 'Os mesmos números, com período e data de apuração.',
  },
]

function onPointerDown(event: MouseEvent) {
  if (open.value && !container.value?.contains(event.target as Node)) open.value = false
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') open.value = false
}

document.addEventListener('mousedown', onPointerDown)
document.addEventListener('keydown', onKeydown)
onScopeDispose(() => {
  document.removeEventListener('mousedown', onPointerDown)
  document.removeEventListener('keydown', onKeydown)
})

function choose(format: ExportFormat) {
  open.value = false
  emit('choose', format)
}
</script>

<template>
  <div
    ref="container"
    class="relative"
  >
    <button
      type="button"
      class="flex h-[46px] items-center gap-2.5 border border-brand bg-brand px-5 text-[15px] font-semibold text-white hover:border-brand-strong hover:bg-brand-strong"
      :aria-expanded="open"
      @click="open = !open"
    >
      <span>Exportar relatório</span>
      <span
        aria-hidden="true"
        class="font-label text-[11px] text-brand-line"
      >▾</span>
    </button>

    <div
      v-if="open"
      class="absolute right-0 top-[calc(100%+10px)] z-20 w-[min(360px,calc(100vw-2rem))] border border-line-strong bg-surface shadow-[0_8px_20px_rgba(16,20,19,0.18)]"
    >
      <div class="flex flex-col gap-0.5 border-b border-line bg-surface-muted px-[18px] py-3.5">
        <p class="font-label text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-soft">
          Exportar
        </p>
        <p class="text-sm text-ink-soft">
          {{ scope }}
        </p>
      </div>

      <ul class="flex flex-col py-2">
        <li
          v-for="format in formats"
          :key="format.id"
        >
          <button
            type="button"
            class="flex w-full flex-col gap-0.5 px-[18px] py-3.5 text-left hover:bg-surface-muted"
            @click="choose(format.id)"
          >
            <span class="text-[15px] font-semibold text-ink">{{ format.title }}</span>
            <span class="text-[13px] leading-normal text-ink-muted">{{ format.detail }}</span>
          </button>
        </li>
      </ul>

      <p class="border-t border-line px-[18px] py-3 text-[13px] leading-normal text-ink-muted">
        O arquivo sai com os filtros atuais e registra no log de auditoria quem exportou e quando.
      </p>
    </div>
  </div>
</template>
