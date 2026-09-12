<script setup lang="ts">
import { computed } from 'vue'

import AppShell from '@/shared/layout/AppShell.vue'
import DpoContactCard from '@/features/landing/components/DpoContactCard.vue'
import HelpFaq from '@/features/help/components/HelpFaq.vue'
import HelpSectionBlock from '@/features/help/components/HelpSectionBlock.vue'
import { GLOSSARY, faqFor, sectionsFor } from '@/features/help/data/helpContent'
import { LGPD_RIGHTS } from '@/shared/constants/lgpdRights'
import { RESPONSE_DEADLINES } from '@/features/landing/data/responseDeadlines'
import { currentRole } from '@/features/auth/composables/useSession'
import { useTenant } from '@/features/tenant/composables/useTenant'

/**
 * Ajuda — a mesma rota para os dois perfis, com o conteúdo de cada um.
 *
 * Sem design no projeto: segue a linguagem das configurações, com o índice ao
 * lado no computador e no alto no celular. O texto é escrito para quem nunca
 * leu a lei; os termos que não dá para evitar vão para o glossário.
 */
const role = currentRole()
const { tenant } = useTenant()

const sections = sectionsFor(role)
const questions = faqFor(role)

const index = computed(() => [
  ...sections.map((section) => ({ id: section.id, title: section.title })),
  { id: 'perguntas', title: 'Perguntas frequentes' },
  { id: 'glossario', title: 'Glossário' },
  ...(role === 'titular' ? [{ id: 'contato', title: 'Falar com a encarregada' }] : []),
])
</script>

<template>
  <AppShell :role="role">
    <div class="mx-auto flex max-w-[1200px] flex-col gap-8">
      <div class="flex max-w-[760px] flex-col gap-2">
        <h1 class="font-serif text-[26px] font-semibold leading-[1.15] text-ink sm:text-[32px]">
          Ajuda
        </h1>
        <p class="text-[15px] leading-relaxed text-ink-soft">
          <template v-if="role === 'titular'">
            Como pedir, acompanhar, cancelar e avaliar um pedido sobre os seus dados — e o que cada
            direito significa.
          </template>
          <template v-else>
            Como atender as requisições dos titulares: a fila, a resposta, o registro por outro
            canal e a prestação de contas.
          </template>
        </p>
      </div>

      <div class="grid items-start gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12">
        <nav
          aria-label="Nesta página"
          class="border border-line bg-surface-muted px-5 py-4 lg:sticky lg:top-6"
        >
          <p class="mb-2 font-label text-[11px] font-semibold uppercase tracking-[0.07em] text-ink-soft">
            Nesta página
          </p>
          <ul class="flex flex-col gap-1.5">
            <li
              v-for="item in index"
              :key="item.id"
            >
              <a
                :href="`#${item.id}`"
                class="text-[15px] text-brand hover:text-brand-strong"
              >{{ item.title }}</a>
            </li>
          </ul>
        </nav>

        <div class="flex min-w-0 flex-col gap-10">
          <HelpSectionBlock
            v-for="section in sections"
            :key="section.id"
            :section="section"
          >
            <ul
              v-if="section.id === 'direitos'"
              class="grid gap-3 sm:grid-cols-2"
            >
              <li
                v-for="right in LGPD_RIGHTS"
                :key="right.numeral"
                class="flex flex-col gap-1 border border-line px-4 py-3.5"
              >
                <span class="text-[15px] font-semibold text-ink">{{ right.title }}</span>
                <span class="text-sm leading-normal text-ink-soft">{{ right.description }}</span>
              </li>
            </ul>
            <dl
              v-else-if="section.id === 'prazos'"
              class="grid gap-3 sm:grid-cols-2"
            >
              <div
                v-for="deadline in RESPONSE_DEADLINES"
                :key="deadline.label"
                class="flex flex-col gap-1 border-l-[3px] border-brand bg-brand-wash px-4 py-3.5"
              >
                <dt class="font-serif text-lg font-semibold text-ink">
                  {{ deadline.label }}
                </dt>
                <dd class="text-[15px] leading-relaxed text-ink-body">
                  {{ deadline.description }}
                </dd>
              </div>
            </dl>
          </HelpSectionBlock>

          <section
            id="perguntas"
            class="flex scroll-mt-24 flex-col gap-4 border-t border-line pt-7"
            aria-labelledby="titulo-perguntas"
          >
            <h2
              id="titulo-perguntas"
              class="font-serif text-[24px] font-semibold text-ink"
            >
              Perguntas frequentes
            </h2>
            <HelpFaq :questions="questions" />
          </section>

          <section
            id="glossario"
            class="flex scroll-mt-24 flex-col gap-4 border-t border-line pt-7"
            aria-labelledby="titulo-glossario"
          >
            <h2
              id="titulo-glossario"
              class="font-serif text-[24px] font-semibold text-ink"
            >
              Glossário
            </h2>
            <dl class="grid gap-x-8 gap-y-4 md:grid-cols-2">
              <div
                v-for="entry in GLOSSARY"
                :key="entry.term"
                class="flex flex-col gap-1"
              >
                <dt class="text-[15px] font-semibold text-ink">
                  {{ entry.term }}
                </dt>
                <dd class="text-[15px] leading-relaxed text-ink-soft">
                  {{ entry.meaning }}
                </dd>
              </div>
            </dl>
          </section>

          <section
            v-if="role === 'titular'"
            id="contato"
            class="flex scroll-mt-24 flex-col gap-4 border-t border-line pt-7"
            aria-labelledby="titulo-contato"
          >
            <h2
              id="titulo-contato"
              class="font-serif text-[24px] font-semibold text-ink"
            >
              Falar com a encarregada
            </h2>
            <p class="max-w-[72ch] text-base leading-relaxed text-ink-body">
              Se a ajuda não respondeu, fale direto com quem responde pelos pedidos
              {{ tenant.article.toLowerCase() === 'o' ? 'no' : 'na' }} {{ tenant.name }}.
            </p>
            <!-- O cartão desfaz o respiro lateral no celular; este invólucro o devolve. -->
            <div class="max-w-[520px] px-5 lg:px-0">
              <DpoContactCard
                :dpo="tenant.dpo"
                :address="tenant.address"
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  </AppShell>
</template>
