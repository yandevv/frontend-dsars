<script setup lang="ts">
import { PERMISSIONS } from '@/features/team/constants/permissions'

/** O que cada perfil faz — informação para quem gerencia a equipe. */
</script>

<template>
  <div class="border border-line">
    <div
      class="hidden grid-cols-[minmax(0,1.2fr)_repeat(2,minmax(0,1fr))] border-b border-line bg-surface-muted sm:grid"
      aria-hidden="true"
    >
      <span
        v-for="heading in ['Operação', 'Titular de dados', 'Encarregado']"
        :key="heading"
        class="px-4 py-3.5 font-label text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-soft"
      >{{ heading }}</span>
    </div>
    <dl>
      <div
        v-for="row in PERMISSIONS"
        :key="row.operation"
        class="grid gap-1 border-b border-line-soft px-4 py-3 last:border-b-0 sm:grid-cols-[minmax(0,1.2fr)_repeat(2,minmax(0,1fr))] sm:gap-0 sm:px-0 sm:py-0"
      >
        <dt class="text-[15px] font-semibold text-ink sm:px-4 sm:py-3">
          {{ row.operation }}
        </dt>
        <dd class="text-sm sm:px-4 sm:py-3">
          <span class="text-ink-muted sm:sr-only">Titular: </span>
          <span :class="row.titular ? 'text-ink' : 'text-ink-faint'">{{ row.titular ?? 'Não' }}</span>
        </dd>
        <dd class="text-sm sm:px-4 sm:py-3">
          <span class="text-ink-muted sm:sr-only">Encarregado: </span>
          <span :class="row.encarregado ? 'text-ink' : 'text-ink-faint'">{{ row.encarregado ?? 'Não' }}</span>
        </dd>
      </div>
    </dl>
  </div>
</template>
