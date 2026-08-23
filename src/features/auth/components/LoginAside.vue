<script setup lang="ts">
import AuthSupportContact from '@/features/auth/components/AuthSupportContact.vue'
import { SIGN_IN_DESTINATIONS } from '@/features/auth/data/signInDestinations'
import {
  LOGIN_LOCKOUT_MINUTES,
  LOGIN_MAX_ATTEMPTS,
} from '@/features/auth/constants/loginPolicy'
import type { DataProtectionOfficer } from '@/features/tenant/types/tenant'

/** Coluna de apoio do acesso: destino por perfil, proteções da conta e contato. */
defineProps<{ dpo: DataProtectionOfficer }>()
</script>

<template>
  <section
    aria-labelledby="acesso-destinos"
    class="flex flex-col gap-3.5"
  >
    <h2
      id="acesso-destinos"
      class="font-serif text-[22px] font-semibold text-ink"
    >
      Para onde você vai depois de entrar
    </h2>
    <p class="text-[15px] leading-relaxed text-ink-body">
      O destino vem da conta, não de uma escolha nesta tela.
    </p>
    <dl class="flex flex-col gap-3">
      <div
        v-for="destination in SIGN_IN_DESTINATIONS"
        :key="destination.role"
        class="flex gap-3"
      >
        <dt class="font-label min-w-[74px] shrink-0 text-[13px] font-bold text-brand">
          {{ destination.label }}
        </dt>
        <dd class="text-[15px] leading-relaxed text-ink-body">
          {{ destination.description }}
        </dd>
      </div>
    </dl>
  </section>

  <section
    aria-labelledby="acesso-protecoes"
    class="flex flex-col gap-3 border-t border-line pt-6"
  >
    <h2
      id="acesso-protecoes"
      class="font-serif text-[22px] font-semibold text-ink"
    >
      Como a conta é protegida
    </h2>
    <p class="text-[15px] leading-relaxed text-ink-body">
      Quando as credenciais não conferem, o aviso é o mesmo para e-mail e para senha.
      Isso evita que alguém descubra, por tentativa, quais endereços têm conta neste portal.
    </p>
    <p class="text-[15px] leading-relaxed text-ink-body">
      Após {{ LOGIN_MAX_ATTEMPTS }} tentativas seguidas sem sucesso, o acesso àquela conta
      fica suspenso por {{ LOGIN_LOCKOUT_MINUTES }} minutos.
    </p>
  </section>

  <AuthSupportContact
    eyebrow="Não consegue entrar"
    :dpo="dpo"
  >
    <p class="text-sm leading-normal text-ink-soft">
      Você também pode registrar um pedido sem conta pelo canal de atendimento
      presencial da unidade.
    </p>
  </AuthSupportContact>
</template>
