<script setup lang="ts">
import AuthSupportContact from '@/features/auth/components/AuthSupportContact.vue'
import GoogleAuthButton from '@/shared/ui/GoogleAuthButton.vue'
import { REGISTRATION_STEPS } from '@/features/auth/data/registrationSteps'
import type { DataProtectionOfficer } from '@/features/tenant/types/tenant'

/** Coluna de apoio do cadastro: alternativa de entrada, o que vem depois e o contato. */
defineProps<{ dpo: DataProtectionOfficer }>()
</script>

<template>
  <section
    aria-labelledby="cadastro-alternativa"
    class="flex flex-col gap-4"
  >
    <h2
      id="cadastro-alternativa"
      class="font-serif text-[22px] font-semibold text-ink"
    >
      Ou use uma conta que você já tem
    </h2>
    <GoogleAuthButton label="Cadastrar-se com o Google" />
    <p class="text-sm leading-relaxed text-ink-soft">
      Ao voltar do Google, pediremos o aceite dos termos de uso e do aviso de privacidade
      antes de concluir o cadastro. Sem esse aceite a conta não é criada.
    </p>
  </section>

  <section
    aria-labelledby="cadastro-proximos-passos"
    class="flex flex-col gap-3.5 border-t border-line pt-6"
  >
    <h2
      id="cadastro-proximos-passos"
      class="font-serif text-[22px] font-semibold text-ink"
    >
      O que acontece depois
    </h2>
    <!-- `role="list"` porque o reset do Tailwind zera o marcador e o Safari
         deixa de anunciar a lista quando ela não tem um. -->
    <ol
      role="list"
      class="flex list-none flex-col gap-3.5"
    >
      <li
        v-for="step in REGISTRATION_STEPS"
        :key="step.number"
        class="flex gap-3"
      >
        <span class="font-label min-w-[22px] shrink-0 text-[13px] font-bold text-brand">
          {{ step.number }}
        </span>
        <span class="text-[15px] leading-relaxed text-ink-body">
          {{ step.description }}
        </span>
      </li>
    </ol>
  </section>

  <AuthSupportContact
    eyebrow="Dúvidas sobre o cadastro"
    :dpo="dpo"
  />
</template>
