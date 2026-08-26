<script setup lang="ts">
import { useRoute } from 'vue-router'

import BasePlaceholder from '@/shared/ui/BasePlaceholder.vue'

/**
 * Destino honesto para as rotas que o cabeçalho cita e ainda não existem.
 *
 * O texto vem do `meta` da rota: assim cada link diz o que vai haver ali em vez
 * de todos caírem na mesma página genérica.
 */
const route = useRoute()
</script>

<template>
  <BasePlaceholder
    :title="route.meta.title ?? 'Tela em construção'"
    :description="route.meta.description ?? 'Esta parte do sistema ainda não foi implementada.'"
  />
</template>
