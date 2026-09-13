<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";

import {
  deadlinePhrase,
  dueAtFor,
  formatDue,
  isImmediate,
  needsAccessFormat,
} from "@/features/requests/utils/responseDeadline";
import { useTenant } from "@/features/tenant/composables/useTenant";
import type { DataSubjectRight } from "@/shared/types/lgpd";
import type { AccessFormat } from "@/features/requests/types/request";

/**
 * Coluna de apoio do formulário.
 *
 * O prazo aparece aqui, ao lado da escolha, e não só depois do envio: saber
 * quanto tempo a organização tem para responder é parte de decidir o que pedir.
 */
const { right, accessFormat } = defineProps<{
  /** Ausente enquanto nenhum direito foi escolhido. */
  right?: DataSubjectRight;
  /** Só no acesso aos dados, e só depois de escolhido. */
  accessFormat?: AccessFormat;
}>();

const { tenant } = useTenant();

/** O acesso sem formato ainda não tem prazo: depende do que a pessoa escolher. */
const pending = computed(() => !!right && needsAccessFormat(right.numeral) && !accessFormat);

const immediate = computed(() => !!right && isImmediate(right.numeral, accessFormat));

const dueAt = computed(() =>
  right ? dueAtFor(new Date().toISOString(), right.numeral, accessFormat) : "",
);

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
        <template v-if="pending">
          Escolha o formato para ver o prazo
        </template>
        <template v-else-if="right">
          {{ deadlinePhrase(immediate) }} · até {{ formatDue(dueAt, immediate) }}
        </template>
        <template v-else>
          Escolha o direito para ver o prazo
        </template>
      </p>
      <p class="text-[15px] leading-relaxed text-ink-body">
        <template v-if="pending">
          O acesso em formato simplificado tem resposta em até 24 horas; a declaração completa, em
          até 15 dias.
        </template>
        <template v-else-if="immediate">
          A LGPD pede resposta imediata a este pedido: a organização responde em até 24 horas do
          registro. Pedidos de complemento não suspendem a contagem.
        </template>
        <template v-else-if="right">
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
