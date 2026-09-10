<script setup lang="ts">
/**
 * Interruptor liga/desliga, no formato quadrado do design.
 *
 * É um `role="switch"` de verdade — o leitor de tela diz "ligado" ou
 * "desligado" — e o estado também vai escrito embaixo, porque a posição do
 * botão sozinha não diz nada a quem não a enxerga bem.
 *
 * Travado aparece cinza e ligado: a comunicação obrigatória fica visível, sem
 * controle, em vez de sumir da matriz.
 */
const { label, locked = false, disabled = false } = defineProps<{
  /** Nome acessível completo — "E-mail para Segurança da conta". */
  label: string
  locked?: boolean
  /** Indisponível agora, por outro motivo — o SMS sem telefone, por exemplo. */
  disabled?: boolean
}>()

const on = defineModel<boolean>({ required: true })

function toggle() {
  if (locked || disabled) return
  on.value = !on.value
}
</script>

<template>
  <div class="flex flex-col items-center gap-[5px]">
    <button
      type="button"
      role="switch"
      :aria-checked="on"
      :aria-label="label"
      :aria-disabled="locked || disabled || undefined"
      :title="locked ? 'Comunicação obrigatória: não pode ser desligada' : undefined"
      class="flex h-[30px] w-[52px] items-center border p-[3px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      :class="[
        on ? 'justify-end' : 'justify-start',
        locked
          ? 'cursor-not-allowed border-ink-faint bg-ink-faint'
          : disabled
            ? 'cursor-not-allowed border-field-disabled-line bg-field-disabled'
            : on
              ? 'border-brand bg-brand'
              : 'border-field-disabled-line bg-track-bar',
      ]"
      @click="toggle"
    >
      <span aria-hidden="true" class="block size-[22px]" :class="on ? 'bg-surface' : 'bg-ink-faint'" />
    </button>
    <span
      aria-hidden="true"
      class="text-[13px]"
      :class="locked ? 'text-ink-muted' : on ? 'text-ink-body' : 'text-ink-faint'"
    >
      {{ locked ? "Travado" : disabled ? "Indisponível" : on ? "Ligado" : "Desligado" }}
    </span>
  </div>
</template>
