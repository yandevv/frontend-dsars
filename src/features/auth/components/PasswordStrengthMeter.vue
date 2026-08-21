<script setup lang="ts">
import { computed } from 'vue'
import type { PasswordCheck, PasswordStrength } from '@/features/auth/types/auth'

/**
 * Critérios do RN002 conferidos em tempo real, com a barra de força.
 *
 * Quando o envio é recusado por causa da senha, o mesmo quadro assume a
 * moldura de erro e diz quantos critérios faltam — em vez de repetir a
 * informação num aviso separado, longe dos itens que a explicam.
 */
const { checks, strength, invalid = false } = defineProps<{
  checks: readonly PasswordCheck[]
  strength: PasswordStrength
  invalid?: boolean
}>()

const pending = computed(() => checks.filter((check) => !check.met).length)

const pendingLabel = computed(() => {
  const words: Record<number, string> = { 1: 'um critério', 2: 'dois critérios', 3: 'três critérios' }
  return `A senha ainda não atende a ${words[pending.value] ?? `${pending.value} critérios`}`
})

const barClasses = computed(
  () =>
    ({
      danger: 'bg-danger',
      warning: 'bg-warning',
      brand: 'bg-brand',
      idle: 'bg-track',
    })[strength.tone],
)

const strengthLabelClasses = computed(
  () =>
    ({
      danger: 'text-danger',
      warning: 'text-warning',
      brand: 'text-brand',
      idle: 'text-ink-body',
    })[strength.tone],
)
</script>

<template>
  <div
    class="flex flex-col gap-3 px-[18px] py-4"
    :class="invalid ? 'border-2 border-danger bg-danger-wash' : 'border border-line bg-surface-muted'"
  >
    <p
      v-if="invalid"
      class="text-sm font-semibold text-danger-strong"
    >
      {{ pendingLabel }}
    </p>

    <template v-else>
      <div class="flex items-center justify-between gap-3">
        <span class="font-label text-xs font-semibold uppercase tracking-[0.06em] text-ink-soft">
          Força da senha
        </span>
        <span
          class="text-[13px] font-semibold"
          :class="strengthLabelClasses"
        >{{ strength.label }}</span>
      </div>

      <!-- Decorativo: a força já é dita em texto logo acima. -->
      <div
        aria-hidden="true"
        class="h-1.5 bg-track"
      >
        <div
          class="h-1.5 transition-[width]"
          :class="barClasses"
          :style="{ width: strength.width }"
        />
      </div>
    </template>

    <!-- `role="list"` porque o reset do Tailwind zera o marcador e o Safari
         deixa de anunciar a lista quando ela não tem um. -->
    <ul
      role="list"
      class="flex list-none flex-col gap-2.5"
    >
      <li
        v-for="check in checks"
        :key="check.id"
        class="flex items-start gap-2.5"
      >
        <span
          aria-hidden="true"
          class="font-label w-3.5 shrink-0 text-sm font-bold leading-snug"
          :class="check.met ? 'text-brand' : invalid ? 'text-danger' : 'text-ink-faint'"
        >{{ check.met ? '✓' : invalid ? '✕' : '○' }}</span>
        <span
          class="text-sm leading-snug"
          :class="check.met ? 'text-ink-body' : invalid ? 'text-danger-strong' : 'text-ink-muted'"
        >
          {{ check.label }}
          <span class="sr-only">— {{ check.met ? 'atendido' : 'ainda não atendido' }}</span>
        </span>
      </li>
    </ul>
  </div>
</template>
