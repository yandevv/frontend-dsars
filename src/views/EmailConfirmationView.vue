<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";

import AuthChrome from "@/features/auth/components/AuthChrome.vue";
import BaseButton from "@/shared/ui/BaseButton.vue";
import {
  CONFIRMATION_LINK_HOURS,
  CONFIRMATION_RESEND_SECONDS,
} from "@/features/auth/constants/confirmationPolicy";
import {
  ConfirmationError,
  confirmEmail,
  lastConfirmationSentAt,
  resendConfirmation,
  type ConfirmationOrigin,
  type ConfirmationResult,
} from "@/features/auth/services/emailConfirmationService";
import { formatDateTime } from "@/shared/utils/date";
import { useResendCountdown } from "@/features/auth/composables/useResendCountdown";
import { useTenant } from "@/features/tenant/composables/useTenant";

/**
 * Turno 1 · Tela 4 — Confirmação de e-mail (RF002 / RF017).
 *
 * Uma tela, duas origens e dois momentos. Sem ficha na URL é a espera: diz para
 * onde o link foi, por quanto tempo vale e deixa pedir outro, respeitando o
 * intervalo mínimo. Com ficha é o resultado da validação — confirmado, vencido
 * ou inválido —, sempre com uma única ação de continuação.
 */
const { tenant } = useTenant();
const route = useRoute();
const router = useRouter();

const token = computed(() =>
  typeof route.params.token === "string" ? route.params.token : "",
);

// ── Espera ───────────────────────────────────────────────────────────────────
const origin = computed<ConfirmationOrigin>(() =>
  route.query.origem === "troca" ? "troca" : "cadastro",
);
const email = computed(() => (typeof route.query.email === "string" ? route.query.email : ""));

const sentAt = ref<number | undefined>(email.value ? lastConfirmationSentAt(email.value) : undefined);
const sends = ref(0);
const resending = ref(false);
const countdown = useResendCountdown(sentAt, CONFIRMATION_RESEND_SECONDS);

watch(email, (value) => {
  sentAt.value = value ? lastConfirmationSentAt(value) : undefined;
});

const intervalMinutes = CONFIRMATION_RESEND_SECONDS / 60;

const resendHelp = computed(() => {
  if (countdown.waiting.value) {
    return "Já enviamos um link há pouco. O intervalo mínimo evita vários links válidos circulando na sua caixa de entrada — aproveite para conferir o spam.";
  }
  if (sends.value > 0) {
    return "Último envio concluído. Se ainda não chegou, confira o spam antes de pedir outro.";
  }
  return `Depois de cada envio, o próximo fica disponível em ${intervalMinutes} minutos.`;
});

async function resend() {
  if (!email.value || resending.value || countdown.waiting.value) return;

  resending.value = true;
  try {
    const result = await resendConfirmation(email.value);
    sentAt.value = new Date(result.sentAt).getTime();
    sends.value += 1;
  } catch (error) {
    if (!(error instanceof ConfirmationError) || !error.detail?.retryAt) throw error;
    sentAt.value =
      new Date(error.detail.retryAt).getTime() - CONFIRMATION_RESEND_SECONDS * 1000;
  } finally {
    resending.value = false;
    countdown.tick();
  }
}

// ── Resultado do link ────────────────────────────────────────────────────────
type LinkState =
  | { status: "validando" }
  | { status: "confirmado"; result: ConfirmationResult }
  | { status: "expirado"; email?: string; sentAt?: string }
  | { status: "invalido" };

const link = ref<LinkState>({ status: "validando" });
const renewing = ref(false);

watch(
  token,
  async (value) => {
    if (!value) return;
    link.value = { status: "validando" };
    try {
      link.value = { status: "confirmado", result: await confirmEmail(value) };
    } catch (error) {
      if (error instanceof ConfirmationError && error.reason === "expirado") {
        link.value = { status: "expirado", ...error.detail };
      } else {
        link.value = { status: "invalido" };
      }
    }
  },
  { immediate: true },
);

/** O link venceu: pede outro e volta à espera, já com o endereço preenchido. */
async function renew(address: string) {
  renewing.value = true;
  try {
    await resendConfirmation(address).catch((error: unknown) => {
      if (!(error instanceof ConfirmationError && error.reason === "intervalo")) throw error;
    });
    await router.replace({
      name: "email-confirmation",
      query: { origem: "cadastro", email: address },
    });
  } finally {
    renewing.value = false;
  }
}
</script>

<template>
  <AuthChrome :tenant="tenant" tagline="Atendimento a requisições de titulares de dados">
    <template #action>
      <RouterLink
        :to="{ name: 'login' }"
        class="border border-line-button px-3.5 py-3 text-sm font-medium text-brand no-underline hover:border-brand md:px-[18px] md:py-[11px] md:text-[15px]"
      >
        Entrar
      </RouterLink>
    </template>

    <main
      id="conteudo-principal"
      tabindex="-1"
      class="flex flex-1 items-start justify-center bg-surface-muted px-5 py-7 md:px-14 md:py-16"
    >
      <div
        class="flex w-full max-w-[680px] flex-col gap-[22px] border border-line bg-surface px-5 pb-8 pt-7 md:gap-[26px] md:px-12 md:pb-12 md:pt-11"
      >
        <!-- ── Espera pela confirmação ─────────────────────────────────── -->
        <template v-if="!token">
          <div class="flex flex-col gap-3">
            <p class="font-label text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft">
              {{ origin === "troca" ? "Alteração de e-mail" : "Confirmação de cadastro" }}
            </p>
            <h1 class="font-serif text-[26px] font-semibold leading-tight text-ink md:text-[34px]">
              {{
                origin === "troca"
                  ? "Confirme o novo endereço para ele passar a valer"
                  : "Confirme seu e-mail para ativar a conta"
              }}
            </h1>
            <p class="text-base leading-relaxed text-ink-body">
              {{
                origin === "troca"
                  ? "Até a confirmação, seu e-mail atual continua valendo: acesso e avisos seguem por ele."
                  : "Abra o link que enviamos. Sem essa confirmação, a conta permanece pendente e não registra requisições."
              }}
            </p>
          </div>

          <div
            v-if="email"
            class="flex flex-col gap-1.5 border-l-[3px] border-brand bg-brand-wash px-4 py-4 md:px-[22px] md:py-5"
          >
            <p class="text-[13px] text-ink-muted">Link enviado para</p>
            <p class="break-all text-[17px] font-semibold text-brand md:text-xl">{{ email }}</p>
            <p class="text-sm leading-normal text-ink-soft">
              Válido por {{ CONFIRMATION_LINK_HOURS }} horas. Cada novo envio invalida o link
              anterior.
            </p>
          </div>

          <div v-if="email" class="flex flex-col gap-3">
            <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <BaseButton href="mailto:" block class="sm:w-auto">Abrir meu e-mail</BaseButton>
              <BaseButton
                variant="secondary"
                block
                class="sm:w-auto"
                :busy="resending"
                :disabled="countdown.waiting.value"
                @click="resend"
              >
                {{
                  resending
                    ? "Reenviando…"
                    : countdown.waiting.value
                      ? `Novo envio em ${countdown.label.value}`
                      : "Reenviar link"
                }}
              </BaseButton>
            </div>
            <p class="text-sm leading-normal text-ink-soft" aria-live="polite">
              {{ resendHelp }}
            </p>
          </div>

          <section class="flex flex-col gap-3.5 border-t border-line pt-6">
            <h2 class="font-serif text-xl font-semibold text-ink">
              Enquanto o e-mail não for confirmado
            </h2>
            <ol class="flex flex-col gap-3">
              <template v-if="origin === 'cadastro'">
                <li class="flex gap-3 text-[15px] leading-relaxed text-ink-body">
                  <span class="min-w-[22px] font-label text-[13px] font-bold text-brand">01</span>
                  Você pode entrar no portal e ver esta pendência na sua conta, mas ainda não
                  registrar requisições.
                </li>
                <li class="flex gap-3 text-[15px] leading-relaxed text-ink-body">
                  <span class="min-w-[22px] font-label text-[13px] font-bold text-brand">02</span>
                  O link funciona em qualquer aparelho. Se abriu o cadastro no computador e o
                  e-mail no celular, pode confirmar por lá.
                </li>
                <li class="flex gap-3 text-[15px] leading-relaxed text-ink-body">
                  <span class="min-w-[22px] font-label text-[13px] font-bold text-brand">03</span>
                  <span>
                    Errou o endereço no cadastro?
                    <RouterLink :to="{ name: 'register' }" class="text-brand underline"
                      >Cadastre de novo com o e-mail certo</RouterLink
                    >.
                  </span>
                </li>
              </template>
              <template v-else>
                <li class="flex gap-3 text-[15px] leading-relaxed text-ink-body">
                  <span class="min-w-[22px] font-label text-[13px] font-bold text-brand">01</span>
                  O endereço atual continua sendo o de acesso e o que recebe os avisos.
                </li>
                <li class="flex gap-3 text-[15px] leading-relaxed text-ink-body">
                  <span class="min-w-[22px] font-label text-[13px] font-bold text-brand">02</span>
                  Um aviso foi para o endereço atual, para o caso de a troca não ter sido você.
                </li>
                <li class="flex gap-3 text-[15px] leading-relaxed text-ink-body">
                  <span class="min-w-[22px] font-label text-[13px] font-bold text-brand">03</span>
                  Se o link vencer, a troca é descartada e precisa ser pedida de novo.
                </li>
              </template>
            </ol>
          </section>

          <div class="flex flex-col gap-1.5 border-t border-line pt-6">
            <p class="text-sm leading-normal text-ink-soft">
              O e-mail não chegou depois de alguns minutos? Confira a caixa de spam e fale com a
              pessoa encarregada de proteção de dados.
            </p>
            <a
              :href="`mailto:${tenant.dpo.email}`"
              class="text-[15px] font-medium text-brand hover:text-brand-strong"
            >
              {{ tenant.dpo.email }}
            </a>
          </div>
        </template>

        <!-- ── Validando ───────────────────────────────────────────────── -->
        <div v-else-if="link.status === 'validando'" role="status" class="flex flex-col gap-3.5">
          <span
            aria-hidden="true"
            class="inline-block size-[26px] animate-spin rounded-full border-[3px] border-brand border-r-track"
          />
          <h1 class="font-serif text-2xl font-semibold leading-tight text-ink">
            Verificando o link…
          </h1>
          <p class="text-[15px] leading-relaxed text-ink-body">
            Leva alguns segundos. Não feche esta aba: se o link for usado e a página fechar antes
            do resultado, será preciso pedir outro.
          </p>
        </div>

        <!-- ── Confirmado ──────────────────────────────────────────────── -->
        <template v-else-if="link.status === 'confirmado'">
          <div
            class="flex flex-col gap-3 border-l-[3px] border-brand bg-brand-wash px-5 py-[22px]"
            role="status"
          >
            <template v-if="link.result.kind === 'cadastro'">
              <h1 class="font-serif text-[26px] font-semibold leading-tight text-ink">
                E-mail confirmado. Conta ativada.
              </h1>
              <p class="text-[15px] leading-relaxed text-ink-body">
                O endereço <strong class="break-all">{{ link.result.email }}</strong> agora está
                validado. Você já pode registrar requisições e acompanhar os prazos de resposta.
              </p>
            </template>
            <template v-else>
              <h1 class="font-serif text-[26px] font-semibold leading-tight text-ink">
                Novo e-mail em vigor
              </h1>
              <dl class="flex flex-col gap-2.5">
                <div class="flex flex-col gap-0.5">
                  <dt class="text-[13px] text-ink-muted">Passa a valer agora</dt>
                  <dd class="break-all text-[17px] font-semibold text-brand">
                    {{ link.result.email }}
                  </dd>
                </div>
                <div class="flex flex-col gap-0.5">
                  <dt class="text-[13px] text-ink-muted">Substitui</dt>
                  <dd class="break-all text-base text-ink-soft line-through">
                    {{ link.result.previous }}
                  </dd>
                </div>
              </dl>
              <p class="text-[15px] leading-relaxed text-ink-body">
                Até esta confirmação, o endereço anterior continuava em uso. A partir de agora,
                acesso e avisos passam pelo novo.
              </p>
            </template>
          </div>

          <div
            v-if="link.result.kind === 'cadastro'"
            class="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap"
          >
            <BaseButton :to="{ name: 'login', query: { email: link.result.email } }">
              Entrar no portal
            </BaseButton>
            <BaseButton variant="secondary" :to="{ name: 'new-request' }">
              Registrar uma requisição
            </BaseButton>
          </div>
          <BaseButton v-else :to="{ name: 'settings' }" block>Voltar aos dados pessoais</BaseButton>
        </template>

        <!-- ── Vencido ─────────────────────────────────────────────────── -->
        <template v-else-if="link.status === 'expirado'">
          <div class="flex flex-col gap-3 border-l-[3px] border-warning bg-warning-wash px-5 py-[22px]">
            <h1 class="font-serif text-[26px] font-semibold leading-tight text-ink">
              Este link venceu
            </h1>
            <p class="text-[15px] leading-relaxed text-ink-body">
              Links de confirmação valem {{ CONFIRMATION_LINK_HOURS }} horas<template
                v-if="link.sentAt"
              >
                — este foi enviado em {{ formatDateTime(link.sentAt) }}</template
              >. Nada foi perdido: pedimos outro e o cadastro continua de onde estava.
            </p>
          </div>
          <div v-if="link.email" class="flex flex-col gap-2.5">
            <p class="text-sm font-semibold text-ink">Reenviar para</p>
            <div
              class="flex flex-wrap items-center justify-between gap-3 border border-line bg-surface-muted px-3.5 py-3"
            >
              <span class="break-all text-[15px] text-ink-body">{{ link.email }}</span>
              <RouterLink :to="{ name: 'register' }" class="text-sm font-medium text-brand">
                Usar outro endereço
              </RouterLink>
            </div>
          </div>
          <BaseButton v-if="link.email" block :busy="renewing" @click="renew(link.email)">
            {{ renewing ? "Enviando…" : "Enviar novo link" }}
          </BaseButton>
        </template>

        <!-- ── Inválido ou já usado ────────────────────────────────────── -->
        <template v-else>
          <div class="flex flex-col gap-3 border-l-[3px] border-ink-muted bg-field-disabled px-5 py-[22px]">
            <h1 class="font-serif text-[26px] font-semibold leading-tight text-ink">
              Não conseguimos usar este link
            </h1>
            <p class="text-[15px] leading-relaxed text-ink-body">
              Ele pode já ter sido usado, ter sido copiado pela metade ou ter sido substituído por
              um envio mais recente. Entre na sua conta: se o e-mail já estiver confirmado, nada
              mais é preciso.
            </p>
          </div>
          <div class="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
            <BaseButton :to="{ name: 'login' }">Ir para o login</BaseButton>
            <BaseButton variant="secondary" :to="{ name: 'login' }">Pedir novo link</BaseButton>
          </div>
          <p class="text-sm leading-normal text-ink-soft">
            Quem ainda não confirmou o e-mail pode pedir um novo link na própria tela de acesso.
          </p>
        </template>
      </div>
    </main>
  </AuthChrome>
</template>
