<script setup lang="ts">
import { computed } from 'vue'

import { formatDate } from '@/shared/utils/date'
import type { InvitePreview } from '@/features/auth/types/invite'
import type { Tenant } from '@/features/tenant/types/tenant'

/**
 * O vínculo que o convite estabelece, escrito antes de ser aceito.
 *
 * É o coração desta variante: quem aceita um convite passa a responder por
 * uma organização, e isso precisa estar na tela — não escondido no link.
 */
const { invite, tenant } = defineProps<{
  invite: InvitePreview
  tenant: Tenant
}>()

const expiresAt = computed(() => formatDate(invite.expiresAt))
</script>

<template>
  <section
    aria-labelledby="convite-vinculo"
    class="flex flex-col gap-4 border border-brand bg-surface px-[22px] py-6"
  >
    <h2
      id="convite-vinculo"
      class="font-label text-xs font-semibold uppercase tracking-[0.06em] text-brand"
    >
      Vínculo que você está aceitando
    </h2>

    <div class="flex flex-col gap-0.5">
      <p class="text-[13px] text-ink-muted">
        Organização controladora
      </p>
      <p class="font-serif text-[22px] font-semibold text-ink">
        {{ invite.organizationName }}
      </p>
      <p class="text-sm text-ink-soft">
        CNPJ {{ tenant.registrationId }}
      </p>
    </div>

    <div class="flex flex-col gap-0.5 border-t border-line pt-3.5">
      <p class="text-[13px] text-ink-muted">
        Perfil atribuído pelo convite
      </p>
      <p class="text-[17px] font-semibold text-ink">
        Encarregado de proteção de dados
      </p>
    </div>

    <!-- A validade também está no cabeçalho, que some em telas estreitas. -->
    <div class="flex flex-col gap-0.5 border-t border-line pt-3.5 md:hidden">
      <p class="text-[13px] text-ink-muted">
        Convite válido até
      </p>
      <p class="text-[17px] font-semibold text-ink">
        {{ expiresAt }}
      </p>
    </div>
  </section>
</template>
