<script setup lang="ts">
import BaseButton from "@/shared/ui/BaseButton.vue";

/** O convite no alto da requisição concluída: duas perguntas, uma única vez. */
defineEmits<{ start: []; dismiss: [] }>();
</script>

<template>
  <section
    aria-labelledby="titulo-convite-pesquisa"
    class="flex flex-wrap items-start justify-between gap-6 border-l-[3px] border-brand bg-brand-wash px-5 py-[18px]"
  >
    <div class="flex max-w-[62ch] flex-col gap-1">
      <h2 id="titulo-convite-pesquisa" class="text-[17px] font-semibold text-ink">
        Como foi o atendimento desta requisição?
      </h2>
      <p class="text-[15px] leading-normal text-ink-body">
        São duas perguntas e leva menos de um minuto. A pesquisa pode ser respondida uma única vez,
        e sua resposta não altera o que já foi decidido no pedido.
      </p>
    </div>
    <div class="flex flex-wrap items-center gap-4">
      <BaseButton @click="$emit('start')">Avaliar atendimento</BaseButton>
      <button
        type="button"
        class="py-1 text-sm text-brand underline hover:text-brand-strong"
        @click="$emit('dismiss')"
      >
        Agora não
      </button>
    </div>
  </section>
</template>
