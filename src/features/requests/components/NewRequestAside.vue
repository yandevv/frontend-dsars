<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";

import { LEGAL_DEADLINE_DAYS } from "@/features/requests/constants/requestPolicy";
import { addDays, formatDate } from "@/shared/utils/date";
import { useTenant } from "@/features/tenant/composables/useTenant";
import type { DataSubjectRight } from "@/shared/types/lgpd";

/**
 * Coluna de apoio do formulário.
 *
 * O prazo aparece aqui, ao lado da escolha, e não só depois do envio: saber
 * quanto tempo a organização tem para responder é parte de decidir o que pedir.
 */
const { right } = defineProps<{
  /** Ausente enquanto nenhum direito foi escolhido. */
  right?: DataSubjectRight;
}>();

const { tenant } = useTenant();

const dueAt = computed(() => addDays(new Date().toISOString(), LEGAL_DEADLINE_DAYS));

const steps = [
  "O sistema gera um protocolo e um identificador únicos e começa a contar o prazo.",
  "Você recebe um aviso por e-mail e pode acompanhar o andamento na sua lista.",
  "Se faltar alguma informação, a pessoa encarregada pede um complemento.",
];
</script>

<template>
  <aside
    class="flex flex-col gap-[22px] border border-line bg-surface-muted px-[26px] pb-[30px] pt-[26px]"
  >
    <section class="flex flex-col gap-2.5">
      <h2 class="font-label text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-soft">
        Prazo desta requisição
      </h2>
      <p class="font-serif text-2xl font-semibold leading-tight text-ink">
        <template v-if="right">
          {{ LEGAL_DEADLINE_DAYS }} dias · até {{ formatDate(dueAt) }}
        </template>
        <template v-else>
          Escolha o direito para ver o prazo
        </template>
      </p>
      <p class="text-[15px] leading-relaxed text-ink-body">
        <template v-if="right">
          Prazo de resposta para {{ right.requestLabel.toLowerCase() }}, contado do registro,
          conforme o art. 19 da LGPD. Pedidos de complemento não suspendem a contagem.
        </template>
        <template v-else>
          Cada direito do art. 18 tem seu prazo de atendimento. Ele aparece aqui assim que você
          selecionar um.
        </template>
      </p>
    </section>

    <section class="flex flex-col gap-2.5 border-t border-line pt-5">
      <h2 class="font-label text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-soft">
        Quem recebe o pedido
      </h2>
      <p class="text-[15px] font-semibold text-ink">
        {{ tenant.dpo.name }}
      </p>
      <p class="text-sm leading-normal text-ink-soft">
        {{ tenant.dpo.role }} · {{ tenant.name }}
      </p>
    </section>

    <section class="flex flex-col gap-2.5 border-t border-line pt-5">
      <h2 class="font-label text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-soft">
        O que acontece ao enviar
      </h2>
      <ol class="flex flex-col gap-2.5">
        <li
          v-for="(step, index) in steps"
          :key="step"
          class="flex gap-3"
        >
          <span class="min-w-[22px] font-label text-[13px] font-bold text-brand">
            {{ String(index + 1).padStart(2, "0") }}
          </span>
          <span class="text-[15px] leading-relaxed text-ink-body">{{ step }}</span>
        </li>
      </ol>
    </section>

    <section class="flex flex-col gap-2 border-t border-line pt-5">
      <p class="text-sm leading-relaxed text-ink-soft">
        Não inclua nos anexos dados de outras pessoas. O pedido trata apenas dos seus dados.
      </p>
      <RouterLink
        :to="{ name: 'home', hash: '#titulo-direitos' }"
        class="text-sm font-medium text-brand hover:text-brand-strong"
      >
        Entenda cada direito do art. 18
      </RouterLink>
    </section>
  </aside>
</template>
