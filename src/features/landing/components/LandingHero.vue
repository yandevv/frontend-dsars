<script setup lang="ts">
import BaseButton from '@/shared/ui/BaseButton.vue'
import DpoContactCard from '@/features/landing/components/DpoContactCard.vue'
import type { Tenant } from '@/features/tenant/types/tenant'

defineProps<{ tenant: Tenant }>()
</script>

<template>
  <section
    aria-labelledby="titulo-principal"
    class="border-b border-line px-5 pt-7 md:px-14 lg:pt-[60px] lg:pb-[52px]"
  >
    <div class="grid gap-6 lg:grid-cols-[1.35fr_0.85fr] lg:gap-14">
      <div class="flex flex-col gap-4 lg:gap-[22px]">
        <!-- No desktop esta linha vive no cabeçalho, ao lado do nome. -->
        <p class="text-xs text-ink-muted md:hidden">
          {{ tenant.tagline }}
        </p>

        <h1
          id="titulo-principal"
          class="font-serif text-[29px] leading-[1.15] font-semibold text-pretty text-ink lg:text-[46px] lg:leading-[1.12]"
        >
          Peça acesso, correção ou exclusão dos seus dados pessoais
        </h1>

        <p class="text-[15px] leading-[1.6] text-pretty text-ink-body lg:max-w-[58ch] lg:text-lg">
          {{ tenant.name }} recebe por aqui os pedidos que a Lei Geral de
          Proteção de Dados garante a você. Cada pedido recebe um número de protocolo, um prazo
          de resposta e um histórico que fica registrado.
        </p>

        <div class="flex flex-col gap-2.5 lg:flex-row lg:gap-3 lg:pt-1">
          <BaseButton
            :to="{ name: 'register' }"
            block
            class="lg:w-auto"
          >
            Registrar-se
          </BaseButton>
          <BaseButton
            :to="{ name: 'login' }"
            variant="secondary"
            block
            class="lg:w-auto"
          >
            Já tenho conta
          </BaseButton>
        </div>
      </div>

      <DpoContactCard
        :dpo="tenant.dpo"
        :address="tenant.address"
      />
    </div>
  </section>
</template>
