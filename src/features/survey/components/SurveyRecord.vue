<script setup lang="ts">
import { ratingLabel } from "@/features/survey/constants/surveyPolicy";
import { formatDateTime } from "@/shared/utils/date";
import type { SurveyAnswer } from "@/features/requests/types/request";

/** A avaliação já enviada, em leitura: sem botão de editar, de propósito. */
defineProps<{ answer: SurveyAnswer }>();
</script>

<template>
  <section class="border border-line-strong bg-surface" aria-labelledby="titulo-avaliacao">
    <div class="flex flex-col gap-1.5 border-b border-line bg-brand-wash px-5 py-5 sm:px-[26px]">
      <h2 id="titulo-avaliacao" class="text-[17px] font-semibold text-ink">
        Avaliação registrada. Agradecemos a resposta.
      </h2>
      <p class="text-[15px] leading-normal text-ink-body">
        A pesquisa desta requisição está encerrada e não pode ser editada.
      </p>
    </div>
    <div class="flex flex-col gap-5 px-5 pb-[26px] pt-6 sm:px-[26px]">
      <div class="flex flex-wrap items-center gap-4">
        <span
          class="flex size-[74px] shrink-0 items-center justify-center bg-brand font-label text-[32px] font-bold text-white"
          aria-hidden="true"
        >
          {{ answer.rating }}
        </span>
        <p class="flex flex-col gap-1">
          <span class="text-[17px] font-semibold text-ink">
            <span class="sr-only">Nota {{ answer.rating }} de 5: </span>{{ ratingLabel(answer.rating) }}
          </span>
          <span class="text-sm text-ink-muted">
            Nota de 1 a 5 · registrada em {{ formatDateTime(answer.answeredAt) }}
          </span>
        </p>
      </div>

      <div v-if="answer.comment" class="flex flex-col gap-1.5 border-l-[3px] border-line py-1 pl-4">
        <p class="font-label text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-faint">
          Seu comentário
        </p>
        <p class="text-base leading-relaxed text-ink-body">{{ answer.comment }}</p>
      </div>

      <p class="max-w-[72ch] text-sm leading-relaxed text-ink-soft">
        A nota entra nos indicadores de qualidade sem identificar quem respondeu. Se precisar reabrir
        o assunto, registre uma nova requisição.
      </p>
    </div>
  </section>
</template>
