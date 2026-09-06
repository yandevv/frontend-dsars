<script setup lang="ts">
import { computed, ref, useId } from "vue";

import BaseButton from "@/shared/ui/BaseButton.vue";
import BasePanel from "@/shared/ui/BasePanel.vue";
import BaseTextarea from "@/shared/ui/BaseTextarea.vue";
import {
  SURVEY_COMMENT_MAX_LENGTH,
  SURVEY_RATINGS,
  ratingLabel,
} from "@/features/survey/constants/surveyPolicy";

/**
 * A pesquisa de satisfação (RF011): uma nota obrigatória e um comentário livre.
 *
 * A nota é um grupo de rádios de verdade, só com cara de botão: setas do
 * teclado mudam a escolha e o leitor de tela anuncia "3 de 5".
 */
const { sending = false } = defineProps<{ sending?: boolean }>();

const emit = defineEmits<{
  submit: [answer: { rating: number; comment: string }];
  close: [];
}>();

const rating = ref<number | null>(null);
const comment = ref("");
const attempted = ref(false);
const groupName = useId();

const ratingHelp = computed(() => {
  if (attempted.value && rating.value === null) return "Escolha uma nota para enviar a avaliação.";
  if (rating.value !== null) {
    return `Sua nota: ${rating.value} · ${ratingLabel(rating.value).toLowerCase()}`;
  }
  return "1 é muito insatisfatório, 5 é muito satisfatório.";
});

function submit() {
  if (sending) return;
  attempted.value = true;
  if (rating.value === null) return;
  emit("submit", { rating: rating.value, comment: comment.value.trim() });
}
</script>

<template>
  <BasePanel eyebrow="Pesquisa de satisfação" title="Sua avaliação do atendimento" tone="brand">
    <template #action>
      <button
        type="button"
        class="flex size-10 items-center justify-center border border-line bg-surface text-xl text-ink-soft hover:border-brand"
        :disabled="sending"
        @click="$emit('close')"
      >
        <span aria-hidden="true">×</span>
        <span class="sr-only">Fechar a pesquisa</span>
      </button>
    </template>

    <form novalidate @submit.prevent="submit">
      <div class="flex flex-col gap-[26px] px-5 pb-[26px] pt-6 sm:px-[26px]">
        <fieldset class="flex flex-col gap-3">
          <legend class="mb-3 text-base font-semibold text-ink">
            1. De 1 a 5, qual nota você dá a este atendimento?
            <span class="text-danger" aria-hidden="true">*</span>
          </legend>
          <div class="grid grid-cols-5 gap-1.5 sm:flex sm:flex-wrap sm:gap-2.5">
            <label
              v-for="option in SURVEY_RATINGS"
              :key="option.value"
              class="flex min-h-14 cursor-pointer flex-col items-center justify-center gap-1.5 px-2 py-3 text-center has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand sm:min-h-24 sm:w-[118px]"
              :class="
                rating === option.value
                  ? 'border-2 border-brand bg-brand text-white'
                  : attempted && rating === null
                    ? 'border-2 border-danger bg-surface'
                    : 'border border-field-line bg-surface'
              "
            >
              <input
                v-model="rating"
                type="radio"
                class="sr-only"
                :name="groupName"
                :value="option.value"
                :disabled="sending"
                :aria-label="`${option.value} — ${option.label}`"
              />
              <span
                class="font-label text-xl font-bold sm:text-[26px]"
                :class="rating === option.value ? 'text-white' : 'text-ink'"
              >
                {{ option.value }}
              </span>
              <span
                class="hidden text-[13px] font-semibold leading-snug sm:block"
                :class="rating === option.value ? 'text-white' : 'text-ink-soft'"
              >
                {{ option.label }}
              </span>
            </label>
          </div>
          <p
            class="text-[13px] leading-normal"
            :class="attempted && rating === null ? 'text-danger' : 'text-ink-muted'"
            aria-live="polite"
          >
            {{ ratingHelp }}
          </p>
        </fieldset>

        <BaseTextarea
          v-model="comment"
          label="2. Quer contar algo sobre o atendimento? (opcional)"
          description="Pode ficar em branco. Se escrever, conte o que ajudou ou o que atrapalhou — a equipe de proteção de dados lê cada comentário."
          :rows="4"
          :maxlength="SURVEY_COMMENT_MAX_LENGTH"
          :disabled="sending"
          hint="Evite incluir dados de saúde ou de terceiros aqui."
          placeholder="Ex.: o arquivo chegou dentro do prazo, mas eu não entendi o nome das colunas."
        />
      </div>

      <div
        class="flex flex-col gap-4 border-t border-line bg-surface-subtle px-5 pb-6 pt-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-[26px]"
      >
        <p class="max-w-[46ch] text-[13px] leading-normal text-ink-muted">
          A pesquisa aceita uma resposta por requisição e não pode ser editada depois do envio.
        </p>
        <div class="flex flex-col-reverse gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
          <BaseButton variant="secondary" :disabled="sending" @click="$emit('close')">
            Responder depois
          </BaseButton>
          <BaseButton type="submit" :busy="sending">
            {{ sending ? "Enviando…" : "Enviar avaliação" }}
          </BaseButton>
        </div>
      </div>
    </form>
  </BasePanel>
</template>
