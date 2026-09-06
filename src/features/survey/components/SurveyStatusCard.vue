<script setup lang="ts">
import { computed } from "vue";

import { formatDate, formatDateTime } from "@/shared/utils/date";
import type { SurveyAnswer } from "@/features/requests/types/request";

/** Onde a pesquisa está: aberta, adiada ou respondida — e as regras dela. */
const { answer, releasedAt, dismissed = false } = defineProps<{
  answer?: SurveyAnswer;
  /** Quando a requisição foi concluída, que é quando a pesquisa abriu. */
  releasedAt?: string;
  /** A pessoa clicou em "Agora não" nesta visita. */
  dismissed?: boolean;
}>();

const state = computed(() => {
  if (answer) return "Respondida";
  return dismissed ? "Aberta · não respondida" : "Aberta";
});

const detail = computed(() => {
  if (answer) return `Uma resposta por requisição. Enviada em ${formatDateTime(answer.answeredAt)}.`;
  const since = releasedAt ? ` em ${formatDate(releasedAt)}` : "";
  return `Liberada${since}, com a conclusão da requisição. Sem prazo de expiração.`;
});
</script>

<template>
  <section class="flex flex-col gap-3 border border-line bg-surface-muted px-5 py-5">
    <h2 class="font-label text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-soft">
      Sobre a pesquisa
    </h2>
    <ul class="flex flex-col gap-2.5 text-sm leading-relaxed text-ink-body">
      <li>Fica disponível a partir da conclusão da requisição e aceita uma única resposta.</li>
      <li>Responder é opcional e não interfere no atendimento nem nos prazos legais.</li>
      <li>A nota entra nos relatórios de qualidade sem identificar quem respondeu.</li>
    </ul>
    <div class="flex flex-col gap-1.5 border-t border-line pt-3">
      <p class="text-[13px] text-ink-muted">Estado da pesquisa</p>
      <p class="text-base font-semibold" :class="answer ? 'text-ink-soft' : 'text-brand'">
        {{ state }}
      </p>
      <p class="text-sm leading-normal text-ink-soft">{{ detail }}</p>
    </div>
  </section>
</template>
