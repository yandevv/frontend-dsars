import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '@/views/HomeView.vue'
import { ROLE_HOME } from '@/features/auth/constants/roleHome'
import { endSession, ensureSession, sessionAccount } from '@/features/auth/composables/useSession'
import { onSessionExpired } from '@/shared/api/http'

declare module 'vue-router' {
  interface RouteMeta {
    /**
     * Quem pode abrir a tela: `conta` pede qualquer sessão; `encarregado`,
     * vínculo com a organização. Sem `access`, a tela é pública.
     */
    access?: 'conta' | 'encarregado'
  }
}

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
      // A troca de e-mail: o link chega ao endereço novo, com a ficha na query.
      path: '/confirmar-novo-email',
      name: 'email-change-confirmation',
      meta: { access: 'conta' },
      component: () => import('@/views/EmailConfirmationView.vue'),
    },
    {
      // O token vem na URL porque o convite é um link nominal enviado por e-mail.
      path: '/convites/:token',
      name: 'invite',
      alias: '/convite/:token',
      component: () => import('@/views/InviteView.vue'),
    },
    // ── Acesso pelo Google ────────────────────────────────────────────────────
    {
      path: '/entrar/google/sucesso',
      name: 'google-success',
      component: () => import('@/views/GoogleCallbackView.vue'),
    },
    {
      path: '/entrar/google/erro',
      name: 'google-error',
      component: () => import('@/views/GoogleCallbackView.vue'),
    },
    {
      path: '/cadastro/google',
      name: 'google-signup',
      component: () => import('@/views/GoogleSignupView.vue'),
    },
    // ── Portal do titular ────────────────────────────────────────────────────
    {
      path: '/requisicoes',
      name: 'my-requests',
      meta: { access: 'conta' },
      component: () => import('@/views/MyRequestsView.vue'),
    },
    {
      path: '/requisicoes/nova',
      name: 'new-request',
      meta: { access: 'conta' },
      component: () => import('@/views/NewRequestView.vue'),
    },
    {
      // Declarada depois de `/requisicoes/nova` para que "nova" não seja lido
      // como identificador.
      path: '/requisicoes/:id',
      name: 'my-request-detail',
      meta: { access: 'conta' },
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
      meta: { access: 'encarregado' },
      component: () => import('@/views/RequestQueueView.vue'),
    },
    {
      // Declarada antes de `/painel/requisicoes/:id` pelo mesmo motivo da rota
      // do titular: "nova" não é um identificador.
      path: '/painel/requisicoes/nova',
      name: 'request-on-behalf',
      meta: { access: 'encarregado' },
      component: () => import('@/views/RegisterOnBehalfView.vue'),
    },
    {
      // A URL leva o identificador (UUID v7), não o protocolo: o protocolo é o
      // número que as pessoas leem e citam, o identificador é o que o sistema
      // referencia — e não expõe a sequência de pedidos da organização.
      path: '/painel/requisicoes/:id',
      name: 'request-detail',
      meta: { access: 'encarregado' },
      component: () => import('@/views/RequestDetailView.vue'),
    },
    {
      path: '/painel/relatorios',
      name: 'management-report',
      meta: { access: 'encarregado' },
      component: () => import('@/views/ManagementReportView.vue'),
    },
    {
      path: '/painel/auditoria',
      name: 'audit-log',
      meta: { access: 'encarregado' },
      component: () => import('@/views/AuditLogView.vue'),
    },
    {
      path: '/painel/equipe',
      name: 'team',
      meta: { access: 'encarregado' },
      component: () => import('@/views/TeamView.vue'),
    },

    // ── Comuns aos dois perfis ───────────────────────────────────────────────
    {
      path: '/notificacoes',
      name: 'notifications',
      meta: { access: 'conta' },
      component: () => import('@/views/NotificationsView.vue'),
    },
    {
      path: '/configuracoes',
      name: 'settings',
      meta: { access: 'conta' },
      component: () => import('@/views/SettingsView.vue'),
    },
    {
      path: '/configuracoes/dados-pessoais',
      name: 'personal-data',
      meta: { access: 'conta' },
      component: () => import('@/views/PersonalDataView.vue'),
    },
    {
      path: '/configuracoes/seguranca',
      name: 'security-settings',
      meta: { access: 'conta' },
      component: () => import('@/views/SecuritySettingsView.vue'),
    },
    {
      path: '/configuracoes/notificacoes',
      name: 'notification-settings',
      meta: { access: 'conta' },
      component: () => import('@/views/NotificationSettingsView.vue'),
    },
    {
      path: '/ajuda',
      name: 'help',
      component: () => import('@/views/HelpView.vue'),
    },

    {
      path: '/recuperar-acesso',
      name: 'password-recovery',
      component: () => import('@/views/PasswordRecoveryView.vue'),
    },
    {
      // O link do e-mail de recuperação, com a ficha na query.
      path: '/redefinir-senha',
      name: 'password-reset',
      component: () => import('@/views/PasswordResetView.vue'),
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

/**
 * A primeira navegação pergunta ao servidor quem está na sessão; as seguintes
 * reaproveitam a resposta. Tela restrita sem sessão leva ao acesso, com o
 * destino guardado para voltar depois; área do encarregado aberta por um
 * titular leva ao ambiente do titular.
 */
router.beforeEach(async (to) => {
  const account = await ensureSession()
  const access = to.meta.access

  if (!access) return true
  if (!account) return { name: 'login', query: { redirect: to.fullPath } }
  if (access === 'encarregado' && account.role !== 'encarregado') return ROLE_HOME[account.role]
  return true
})

// A renovação falhou no meio do uso: a sessão acabou do lado do servidor.
onSessionExpired(() => {
  if (!sessionAccount()) return
  endSession()
  const current = router.currentRoute.value
  if (current.meta.access) {
    void router.replace({ name: 'login', query: { redirect: current.fullPath, sessao: 'expirada' } })
  }
})

export default router
