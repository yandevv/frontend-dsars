<script setup lang="ts">
import BaseButton from '@/shared/ui/BaseButton.vue'

/**
 * Tela mínima para rotas que ainda não têm implementação — e para o 404.
 *
 * Existe para que toda CTA da página inicial leve a algum lugar honesto em vez
 * de a um link morto, sem fingir uma interface que ainda não foi construída.
 */
const {
  eyebrow = 'Tela em construção',
  title,
  description,
} = defineProps<{
  eyebrow?: string
  title: string
  description: string
}>()
</script>

<template>
  <main
    id="conteudo-principal"
    tabindex="-1"
    class="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-4 px-5 py-16"
  >
    <p class="font-label text-xs uppercase tracking-[0.08em] text-ink-muted">
      {{ eyebrow }}
    </p>
    <h1 class="font-serif text-3xl font-semibold text-ink">
      {{ title }}
    </h1>
    <p class="leading-relaxed text-ink-body">
      {{ description }}
    </p>
    <div class="pt-2">
      <BaseButton
        :to="{ name: 'home' }"
        variant="secondary"
        size="sm"
      >
        Voltar ao início
      </BaseButton>
    </div>
  </main>
</template>
