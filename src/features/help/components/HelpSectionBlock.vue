<script setup lang="ts">
import BaseButton from '@/shared/ui/BaseButton.vue'
import type { HelpSection } from '@/features/help/types/help'

/**
 * Uma seção da ajuda. O conteúdo que não cabe em tópicos — a lista de
 * direitos, os prazos — entra pelo slot, entre a introdução e os tópicos.
 */
defineProps<{ section: HelpSection }>()
</script>

<template>
  <section
    :id="section.id"
    class="flex scroll-mt-24 flex-col gap-4 border-t border-line pt-7"
    :aria-labelledby="`titulo-${section.id}`"
  >
    <h2
      :id="`titulo-${section.id}`"
      class="font-serif text-[24px] font-semibold leading-tight text-ink"
    >
      {{ section.title }}
    </h2>
    <p class="max-w-[72ch] text-base leading-relaxed text-ink-body">
      {{ section.intro }}
    </p>

    <slot />

    <dl
      v-if="section.topics.length > 0"
      class="grid gap-x-8 gap-y-5 md:grid-cols-2"
    >
      <div
        v-for="topic in section.topics"
        :key="topic.title"
        class="flex flex-col gap-1.5 border-l-[3px] border-line-soft pl-4"
      >
        <dt class="text-[15px] font-semibold text-ink">
          {{ topic.title }}
        </dt>
        <dd class="text-[15px] leading-relaxed text-ink-soft">
          {{ topic.text }}
        </dd>
      </div>
    </dl>

    <div
      v-if="section.action"
      class="pt-1"
    >
      <BaseButton
        variant="secondary"
        size="sm"
        :to="section.action.to"
      >
        {{ section.action.label }}
      </BaseButton>
    </div>
  </section>
</template>
