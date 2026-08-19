<script setup lang="ts">
import { LGPD_RIGHTS, LGPD_RIGHTS_LEGAL_REFERENCE } from '@/shared/constants/lgpdRights'

defineProps<{
  /** Corresponde ao `mostrarReferenciasLegais` do design. */
  showLegalReference: boolean
}>()
</script>

<template>
  <section
    aria-labelledby="titulo-direitos"
    class="flex flex-col gap-4 border-b border-line px-5 py-[26px] md:px-14 md:gap-7 md:py-[52px]"
  >
    <div class="flex flex-wrap items-baseline gap-x-3.5 gap-y-1">
      <h2
        id="titulo-direitos"
        class="font-serif text-[23px] font-semibold text-ink md:text-[30px]"
      >
        O que você pode pedir
      </h2>
      <p
        v-if="showLegalReference"
        class="font-label text-xs text-ink-muted"
      >
        {{ LGPD_RIGHTS_LEGAL_REFERENCE }}
      </p>
    </div>

    <!--
      O fundo cinza aparece pelos vãos de 1px do grid: é assim que o design
      desenha a "tabela" de filetes, sem bordas por célula.
    -->
    <!--
      `role="list"` é necessário porque o reset do Tailwind zera o marcador da
      lista, e o Safari deixa de anunciar semântica de lista quando isso
      acontece. Sem ele, o leitor de tela não diz "lista com 9 itens".
    -->
    <ol
      role="list"
      class="grid list-none gap-px border border-line bg-line md:grid-cols-3"
    >
      <li
        v-for="right in LGPD_RIGHTS"
        :key="right.numeral"
        class="flex gap-3 bg-surface px-4 py-3.5 md:flex-col md:gap-[7px] md:px-5 md:py-[22px]"
      >
        <span class="font-label min-w-[26px] shrink-0 text-xs text-brand md:min-w-0">
          {{ right.numeral }}
        </span>
        <span class="flex flex-col gap-0.5 md:gap-[7px]">
          <span class="text-[15px] font-semibold text-ink md:text-base">
            {{ right.title }}
          </span>
          <span class="text-[13px] leading-[1.5] text-ink-soft md:text-sm md:leading-[1.55]">
            {{ right.description }}
          </span>
        </span>
      </li>
    </ol>
  </section>
</template>
