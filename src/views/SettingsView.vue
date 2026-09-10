<script setup lang="ts">
import { onMounted, ref } from "vue";

import BaseButton from "@/shared/ui/BaseButton.vue";
import SettingsLayout from "@/features/settings/components/SettingsLayout.vue";
import { currentRole, useSession } from "@/features/auth/composables/useSession";
import { fetchProfile } from "@/features/settings/services/accountSettingsService";
import { fetchSecurity } from "@/features/settings/services/securityService";
import { formatDate } from "@/shared/utils/date";
import type { AccountProfile } from "@/features/settings/types/profile";
import type { SecurityOverview } from "@/features/settings/types/security";

/**
 * Turno 1 · Tela 16 — Configurações da conta (RF015).
 *
 * O hub: as três seções lado a lado, cada uma com o que importa saber antes
 * de entrar nela. Vale para titular e encarregado — cada um vê a própria conta.
 */
const role = currentRole();
const { account } = useSession(role);

const profile = ref<AccountProfile | null>(null);
const security = ref<SecurityOverview | null>(null);

onMounted(async () => {
  [profile.value, security.value] = await Promise.all([
    fetchProfile(account.value.email),
    fetchSecurity(account.value.email),
  ]);
});
</script>

<template>
  <SettingsLayout
    :role="role"
    section="hub"
    title="Configurações"
    subtitle="Dados da conta, acesso e preferências de aviso. As alterações valem para este perfil e ficam registradas em auditoria."
  >
    <div class="grid gap-[18px] md:grid-cols-2 xl:grid-cols-3">
      <section class="flex flex-col justify-between gap-[18px] border border-line px-[22px] pb-5 pt-[22px]">
        <div class="flex flex-col gap-2">
          <p class="font-label text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-soft">
            Conta
          </p>
          <h2 class="font-serif text-[22px] font-semibold leading-tight text-ink">Dados pessoais</h2>
          <p class="text-[15px] leading-relaxed text-ink-soft">
            Nome, e-mail, documento e telefone, com a identificação mascarada por padrão.
          </p>
          <dl class="mt-1 flex flex-col gap-1.5">
            <div class="flex items-baseline justify-between gap-3 border-t border-line-soft pt-[7px]">
              <dt class="text-sm text-ink-muted">Documento</dt>
              <dd class="text-sm font-medium text-brand">CPF verificado</dd>
            </div>
            <div class="flex items-baseline justify-between gap-3 border-t border-line-soft pt-[7px]">
              <dt class="text-sm text-ink-muted">E-mail</dt>
              <dd
                class="text-right text-sm font-medium"
                :class="profile?.pendingEmail ? 'text-due-soon-ink' : 'text-ink'"
              >
                {{ !profile ? "…" : profile.pendingEmail ? "Troca pendente" : "Confirmado" }}
              </dd>
            </div>
          </dl>
        </div>
        <BaseButton variant="secondary" size="sm" class="self-start" :to="{ name: 'personal-data' }">
          Abrir dados pessoais
        </BaseButton>
      </section>

      <section class="flex flex-col justify-between gap-[18px] border border-line px-[22px] pb-5 pt-[22px]">
        <div class="flex flex-col gap-2">
          <p class="font-label text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-soft">
            Acesso
          </p>
          <h2 class="font-serif text-[22px] font-semibold leading-tight text-ink">Segurança</h2>
          <p class="text-[15px] leading-relaxed text-ink-soft">
            Data da última troca de senha e todos os dispositivos conectados a esta conta.
          </p>
          <dl class="mt-1 flex flex-col gap-1.5">
            <div class="flex items-baseline justify-between gap-3 border-t border-line-soft pt-[7px]">
              <dt class="text-sm text-ink-muted">Senha alterada</dt>
              <dd class="text-sm font-medium text-ink">
                {{ security ? formatDate(security.passwordChangedAt) : "…" }}
              </dd>
            </div>
            <div class="flex items-baseline justify-between gap-3 border-t border-line-soft pt-[7px]">
              <dt class="text-sm text-ink-muted">Sessões ativas</dt>
              <dd
                class="text-sm font-medium"
                :class="security && security.sessions.length > 3 ? 'text-due-soon-ink' : 'text-ink'"
              >
                {{
                  !security
                    ? "…"
                    : `${security.sessions.length} ${security.sessions.length === 1 ? "dispositivo" : "dispositivos"}`
                }}
              </dd>
            </div>
          </dl>
        </div>
        <BaseButton
          variant="secondary"
          size="sm"
          class="self-start"
          :to="{ name: 'security-settings' }"
        >
          Abrir segurança
        </BaseButton>
      </section>

      <section class="flex flex-col justify-between gap-[18px] border border-line px-[22px] pb-5 pt-[22px]">
        <div class="flex flex-col gap-2">
          <p class="font-label text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-soft">
            Avisos
          </p>
          <h2 class="font-serif text-[22px] font-semibold leading-tight text-ink">Notificações</h2>
          <p class="text-[15px] leading-relaxed text-ink-soft">
            Por qual canal cada aviso chega, com as comunicações obrigatórias travadas.
          </p>
        </div>
        <BaseButton
          variant="secondary"
          size="sm"
          class="self-start"
          :to="{ name: 'notification-settings' }"
        >
          Abrir notificações
        </BaseButton>
      </section>
    </div>

    <section class="flex items-start gap-3.5 border border-line bg-surface-muted px-[22px] py-5">
      <span aria-hidden="true" class="w-[3px] shrink-0 self-stretch bg-ink-muted" />
      <div class="flex flex-col gap-1">
        <h2 class="text-[15px] font-semibold text-ink">Toda alteração fica registrada</h2>
        <p class="max-w-[92ch] text-sm leading-relaxed text-ink-soft">
          Mudanças de dados, de senha e de preferências de notificação entram no registro de
          auditoria com data, hora e origem. Você recebe um aviso por e-mail a cada alteração de
          segurança, inclusive quando parte de outro dispositivo.
        </p>
      </div>
    </section>
  </SettingsLayout>
</template>
