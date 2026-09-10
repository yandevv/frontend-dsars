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
      // Espera pela confirmação: a origem e o endereço vêm na query, para que a
      // mesma tela sirva ao cadastro e à troca de e-mail.
      path: '/confirmar-email',
      name: 'email-confirmation',
      component: () => import('@/views/EmailConfirmationView.vue'),
    },
    {
      // O link aberto pela pessoa: a ficha na URL é o que o servidor valida.
      path: '/confirmar-email/:token',
      name: 'email-confirmation-link',
      component: () => import('@/views/EmailConfirmationView.vue'),
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
      component: () => import('@/views/MyRequestsView.vue'),
    },
    {
      path: '/requisicoes/nova',
      name: 'new-request',
      component: () => import('@/views/NewRequestView.vue'),
    },
    {
      // Declarada depois de `/requisicoes/nova` para que "nova" não seja lido
      // como identificador.
      path: '/requisicoes/:id',
      name: 'my-request-detail',
      component: () => import('@/views/MyRequestDetailView.vue'),
    },
    {
      path: '/meus-dados',
      name: 'my-data',
      // "Meus dados" do portal do titular é a seção de dados pessoais das configurações.
      redirect: { name: 'personal-data' },
    },

    // ── Área do encarregado ──────────────────────────────────────────────────
    {
      path: '/painel/fila',
      name: 'request-queue',
      component: () => import('@/views/RequestQueueView.vue'),
    },
    {
      // A URL leva o identificador (UUID v7), não o protocolo: o protocolo é o
      // número que as pessoas leem e citam, o identificador é o que o sistema
      // referencia — e não expõe a sequência de pedidos da organização.
      path: '/painel/requisicoes/:id',
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
      component: () => import('@/views/NotificationsView.vue'),
    },
    {
      path: '/configuracoes',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue'),
    },
    {
      path: '/configuracoes/dados-pessoais',
      name: 'personal-data',
      component: () => import('@/views/PersonalDataView.vue'),
    },
    {
      path: '/configuracoes/seguranca',
      name: 'security-settings',
      component: () => import('@/views/SecuritySettingsView.vue'),
    },
    {
      path: '/configuracoes/notificacoes',
      name: 'notification-settings',
      component: () => import('@/views/NotificationSettingsView.vue'),
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
  scrollBehavior(to, _from, savedPosition) {
    // Voltar/avançar restaura a posição; um link com âncora leva à seção;
    // navegação nova começa do topo.
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash }
    return { top: 0 }
  },
})

export default router
