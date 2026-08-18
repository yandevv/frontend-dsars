import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '@/views/HomeView.vue'

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
