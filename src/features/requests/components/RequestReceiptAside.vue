<script setup lang="ts">
/** Coluna de apoio do comprovante: para onde ele foi e o que fazer se o prazo passar. */
defineProps<{ email: string }>()
</script>

<template>
  <aside class="flex flex-col gap-5 border border-line bg-surface-muted px-[26px] pb-[30px] pt-[26px]">
    <section class="flex flex-col gap-2.5">
      <h2 class="font-label text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-soft">
        Comprovante
      </h2>
      <p class="text-[15px] leading-relaxed text-ink-body">
        Enviamos o protocolo e o prazo para
        <span class="break-words font-medium">{{ email }}</span>. O comprovante também fica
        disponível na requisição.
      </p>
    </section>

    <section class="flex flex-col gap-2 border-t border-line pt-5">
      <h2 class="font-label text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-soft">
        Se o prazo não for cumprido
      </h2>
      <p class="text-[15px] leading-relaxed text-ink-body">
        Você pode cobrar a resposta pelo próprio pedido e, se preferir, registrar reclamação na
        ANPD com este protocolo.
      </p>
    </section>
  </aside>
</template>
