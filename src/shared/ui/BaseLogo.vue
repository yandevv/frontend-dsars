<script setup lang="ts">
/**
 * Marca gráfica da organização.
 *
 * O design usa um quadrado sólido como espaço reservado para o logotipo, sem
 * cantos arredondados. É puramente decorativo: o nome da organização vem
 * sempre ao lado, em texto, por isso fica escondido de leitores de tela.
 */
const { size = 'md', tone = 'brand' } = defineProps<{
  size?: 'sm' | 'md'
  /** `light` inverte a marca para o cabeçalho escuro da tela de convite. */
  tone?: 'brand' | 'light'
}>()
</script>

<template>
  <span
    aria-hidden="true"
    class="block shrink-0"
    :class="[size === 'sm' ? 'size-5' : 'size-[26px]', tone === 'light' ? 'bg-white' : 'bg-brand']"
  />
</template>
