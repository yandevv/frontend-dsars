<script setup lang="ts">
import { RouterLink } from 'vue-router'

import type { AppNavItem } from '@/shared/layout/types'

/**
 * Caminho até a tela atual.
 *
 * O último item não é link — é onde a pessoa está — e por isso recebe
 * `aria-current`, que é o que um leitor de tela usa para dizer isso.
 */
defineProps<{
  trail: readonly AppNavItem[]
  current: string
}>()
</script>

<template>
  <nav aria-label="Você está em">
    <ol class="flex flex-wrap items-center gap-2.5 text-sm">
      <li
        v-for="item in trail"
        :key="item.label"
        class="flex items-center gap-2.5"
      >
        <RouterLink
          :to="item.to"
          class="text-brand no-underline hover:text-brand-strong"
        >
          {{ item.label }}
        </RouterLink>
        <span
          aria-hidden="true"
          class="text-field-placeholder"
        >/</span>
      </li>
      <li
        aria-current="page"
        class="text-ink-soft"
      >
        {{ current }}
      </li>
    </ol>
  </nav>
</template>
