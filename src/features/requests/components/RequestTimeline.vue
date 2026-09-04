<script setup lang="ts">
import { computed } from 'vue'

import BasePanel from '@/shared/ui/BasePanel.vue'
import { formatDateTime } from '@/shared/utils/date'
import type { RequestTimelineEntry } from '@/features/requests/types/request'
import type { RequestAudience } from '@/features/requests/types/audience'

/**
 * Histórico e auditoria da requisição (RF006 / RF013).
 *
 * É uma `<ol>` do mais recente para o mais antigo: a última coisa que
 * aconteceu é a que interessa a quem abre a requisição, e quem precisa da
 * história inteira rola até o registro.
 *
 * O titular vê o mesmo histórico sem o trabalho interno da equipe e sem a
 * coluna de autor: para ele, quem atende é a organização.
 */
const { entries, audience = 'encarregado' } = defineProps<{
  entries: readonly RequestTimelineEntry[]
  audience?: RequestAudience
}>()

defineEmits<{ export: [] }>()

const titular = computed(() => audience === 'titular')

const shown = computed(() =>
  titular.value ? entries.filter((entry) => !entry.internal) : entries,
)
</script>

<template>
  <BasePanel :eyebrow="titular ? 'Histórico da requisição' : 'Histórico e auditoria'">
    <template
      v-if="!titular"
      #action
    >
      <button
        type="button"
        class="text-sm font-medium text-brand hover:text-brand-strong"
        @click="$emit('export')"
      >
        Exportar trilha
      </button>
    </template>

    <ol>
      <li
        v-for="entry in shown"
        :key="`${entry.at}-${entry.title}`"
        class="grid gap-4 border-b border-line-soft px-[22px] py-[15px] last:border-b-0 md:items-baseline"
        :class="[
          entry.highlight ? 'bg-surface-muted' : 'bg-surface',
          titular ? 'md:grid-cols-[168px_minmax(0,1fr)]' : 'md:grid-cols-[168px_minmax(0,1fr)_150px]',
        ]"
      >
        <p class="font-label text-sm text-ink-muted">
          {{ formatDateTime(entry.at) }}
        </p>
        <div class="flex flex-col gap-1">
          <p class="text-[15px] font-semibold text-ink">
            {{ entry.title }}
          </p>
          <p class="text-sm leading-normal text-ink-soft">
            {{ entry.detail }}
          </p>
        </div>
        <p
          v-if="!titular"
          class="text-sm text-ink-muted"
        >
          {{ entry.author }}
        </p>
      </li>
    </ol>
  </BasePanel>
</template>
