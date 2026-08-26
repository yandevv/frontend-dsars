import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '@/views/HomeView.vue'

/**
 * Texto das rotas que ainda são um lugar reservado. Fica no `meta` para que
 * `UnderConstructionView` explique o que virá ali sem precisar de um
 * componente por rota.
 */
declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    description?: string
  }
}

const underConstruction = () => import('@/views/UnderConstructionView.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      // Carregada junto com o bundle: é a porta de entrada do portal.
      component: HomeView,
    },
    {
      path: '/entrar',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
    },
    {
      path: '/registrar',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
    },
    {
      // O token vem na URL porque o convite é um link nominal enviado por e-mail.
      path: '/convite/:token',
      name: 'invite',
      component: () => import('@/views/InviteView.vue'),
    },
    // ── Portal do titular ────────────────────────────────────────────────────
    {
      path: '/requisicoes',
      name: 'my-requests',
      component: underConstruction,
      meta: {
        title: 'Minhas requisições',
        description:
          'A lista das suas requisições, com estado e prazo de cada uma, ainda não foi implementada.',
      },
    },
    {
      path: '/requisicoes/nova',
      name: 'new-request',
      component: () => import('@/views/NewRequestView.vue'),
    },
    {
      path: '/meus-dados',
      name: 'my-data',
      component: underConstruction,
      meta: {
        title: 'Meus dados',
        description:
          'A página com os dados cadastrais da sua conta ainda não foi implementada.',
      },
    },

    // ── Área do encarregado ──────────────────────────────────────────────────
    {
      path: '/painel/fila',
      name: 'request-queue',
      component: () => import('@/views/RequestQueueView.vue'),
    },
    {
      // O protocolo vem na URL porque é o identificador que o titular guarda e
      // que aparece em qualquer contato com a organização ou com a ANPD.
      path: '/painel/requisicoes/:protocol',
      name: 'request-detail',
      component: () => import('@/views/RequestDetailView.vue'),
    },
    {
      path: '/painel/relatorios',
      name: 'management-report',
      component: () => import('@/views/ManagementReportView.vue'),
    },
    {
      path: '/painel/auditoria',
      name: 'audit-log',
      component: underConstruction,
      meta: {
        title: 'Registros de auditoria',
        description:
          'A trilha de auditoria completa da organização ainda não foi implementada.',
      },
    },
    {
      path: '/painel/equipe',
      name: 'team',
      component: underConstruction,
      meta: {
        title: 'Equipe e permissões',
        description:
          'A gestão de quem atende requisições na organização ainda não foi implementada.',
      },
    },

    // ── Comuns aos dois perfis ───────────────────────────────────────────────
    {
      path: '/notificacoes',
      name: 'notifications',
      component: underConstruction,
      meta: {
        title: 'Notificações',
        description: 'A lista completa de avisos ainda não foi implementada.',
      },
    },
    {
      path: '/configuracoes',
      name: 'settings',
      component: underConstruction,
      meta: {
        title: 'Configurações da conta',
        description: 'As configurações da conta ainda não foram implementadas.',
      },
    },
    {
      path: '/configuracoes/notificacoes',
      name: 'notification-settings',
      component: underConstruction,
      meta: {
        title: 'Preferências de notificação',
        description:
          'A escolha de quais avisos chegam por e-mail ainda não foi implementada.',
      },
    },
    {
      path: '/ajuda',
      name: 'help',
      component: underConstruction,
      meta: {
        title: 'Ajuda',
        description:
          'O material de apoio sobre requisições de titulares ainda não foi implementado.',
      },
    },

    {
      path: '/recuperar-acesso',
      name: 'password-recovery',
      component: () => import('@/views/PasswordRecoveryView.vue'),
    },
    {
      path: '/termos-de-uso',
      name: 'terms',
      component: () => import('@/views/TermsView.vue'),
    },
    {
      path: '/aviso-de-privacidade',
      name: 'privacy',
      component: () => import('@/views/PrivacyView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
    },
  ],
  scrollBehavior(_to, _from, savedPosition) {
    // Voltar/avançar restaura a posição; navegação nova começa do topo.
    return savedPosition ?? { top: 0 }
  },
})

export default router
