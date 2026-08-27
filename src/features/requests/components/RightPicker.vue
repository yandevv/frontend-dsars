<script setup lang="ts">
import { useId } from 'vue'

import { LGPD_RIGHTS, legalReferenceFor } from '@/shared/constants/lgpdRights'

/**
 * Escolha do direito exercido, um por requisição.
 *
 * É um `radiogroup` de verdade, e não uma lista de cartões clicáveis: pedidos
 * diferentes têm prazos e desfechos diferentes, e o teclado precisa poder
 * percorrer as nove opções como percorre qualquer grupo de rádio.
 */
const { invalid = false } = defineProps<{
  /** Envio tentado sem escolha: o grupo inteiro passa a chamar atenção. */
  invalid?: boolean
}>()

const model = defineModel<string>({ required: true })

const groupName = useId()
</script>

<template>
  <fieldset class="flex flex-col gap-3.5">
    <legend class="flex flex-col gap-1">
      <span class="text-base font-semibold text-ink">
        Direito exercido
        <span
          class="text-danger"
          aria-hidden="true"
        >*</span>
      </span>
      <span class="text-sm leading-normal text-ink-muted">
        Os direitos abaixo são os do art. 18 da LGPD. Em caso de dúvida, escolha o mais
        próximo — a pessoa encarregada pode reclassificar e avisar você.
      </span>
    </legend>

    <label
      v-for="right in LGPD_RIGHTS"
      :key="right.numeral"
      class="grid cursor-pointer grid-cols-[24px_1fr] items-start gap-3.5 px-[18px] py-4"
      :class="
        model === right.numeral
          ? 'border-2 border-brand bg-brand-wash'
          : invalid
            ? 'border border-danger-line bg-surface'
            : 'border border-line bg-surface'
      "
    >
      <input
        v-model="model"
        type="radio"
        :name="groupName"
        :value="right.numeral"
        class="mt-0.5 size-5 accent-brand"
      >
      <span class="flex flex-col gap-1">
        <span class="flex flex-wrap items-baseline gap-2.5">
          <span class="text-base font-semibold text-ink">{{ right.requestLabel }}</span>
          <span
            class="font-label text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-soft"
          >
            {{ legalReferenceFor(right.numeral) }}
          </span>
        </span>
        <span class="text-[15px] leading-normal text-ink-soft">{{ right.requestSummary }}</span>
      </span>
    </label>
  </fieldset>
</template>
