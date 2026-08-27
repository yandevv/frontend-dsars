<script setup lang="ts">
import BasePanel from '@/shared/ui/BasePanel.vue'
import { formatDateTime } from '@/shared/utils/date'
import type { InternalNote } from '@/features/requests/types/request'

/** Anotações da equipe: ficam fora da resposta, mas entram na trilha de auditoria. */
defineProps<{ notes: readonly InternalNote[] }>()
</script>

<template>
  <BasePanel eyebrow="Notas internas">
    <div class="flex flex-col gap-3.5 px-[22px] pb-[22px] pt-[18px]">
      <p
        v-if="notes.length === 0"
        class="text-[15px] leading-relaxed text-ink-soft"
      >
        Nenhuma nota registrada neste atendimento.
      </p>

      <div
        v-for="note in notes"
        :key="note.at"
        class="flex flex-col gap-1 border-l-[3px] border-line py-0.5 pl-3.5"
      >
        <p class="text-[15px] leading-relaxed text-ink-body">
          {{ note.text }}
        </p>
        <p class="text-[13px] text-ink-muted">
          {{ note.author }} · {{ formatDateTime(note.at) }}
        </p>
      </div>

      <p class="text-sm leading-relaxed text-ink-soft">
        Notas internas ficam fora da resposta e não são visíveis ao titular, mas entram na trilha
        de auditoria.
      </p>
    </div>
  </BasePanel>
</template>
