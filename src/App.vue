<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <a
    href="#conteudo-principal"
    class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-brand focus:px-4 focus:py-2 focus:font-medium focus:text-white"
  >
    Ir para o conteúdo principal
  </a>
  <RouterView />
</template>
