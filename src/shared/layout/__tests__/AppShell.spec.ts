import { describe, it, expect, beforeEach } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'

import AppShell from '../AppShell.vue'
import { APP_AREAS } from '../areas'
import { resetNotifications } from '@/features/notifications/composables/useNotifications'
import { startSession } from '@/features/auth/composables/useSession'
import { mockApi, route } from '@/test/api'
import type { ApiNotification } from '@/shared/api/contracts'

function notification(id: string, read: boolean): ApiNotification {
  return {
    id,
    eventType: 'REQUEST_REGISTERED',
    title: `Aviso ${id}`,
    body: 'Uma requisição foi registrada na plataforma.',
    resourceType: 'Request',
    resourceId: `r-${id}`,
    read,
    readAt: null,
    createdAt: new Date().toISOString(),
  }
}

/** Uma caixa com três avisos não lidos e um lido. */
function inbox() {
  let items = [notification('n1', false), notification('n2', false), notification('n3', false), notification('n4', true)]
  mockApi([
    route('GET', '/me/notifications', () => ({ items, page: 1, pageSize: 20, total: items.length })),
    route('GET', '/me/notifications/unread-count', () => ({
      unreadCount: items.filter((item) => !item.read).length,
    })),
    route('POST', '/me/notifications/read-all', () => {
      items = items.map((item) => ({ ...item, read: true }))
      return {}
    }),
  ])
}

/**
 * A moldura depende de rotas nomeadas de verdade: o cabeçalho monta os links a
 * partir de `APP_AREAS`, e um nome ausente só apareceria em tempo de execução.
 */
function buildRouter(): Router {
  const names = new Set<string>(['home', 'login', 'terms', 'privacy', 'notifications'])
  for (const area of Object.values(APP_AREAS)) {
    for (const item of [...area.nav, ...area.accountLinks]) {
      names.add(String((item.to as { name: string }).name))
    }
  }

  return createRouter({
    history: createMemoryHistory(),
    routes: [...names].map((name) => ({
      path: `/${name}`,
      name,
      component: { template: '<div />' },
    })),
  })
}

let router: Router

beforeEach(async () => {
  // As caixas de aviso vivem no módulo: cada teste começa da demonstração.
  resetNotifications()
  startSession({
    id: 'conta-helena',
    name: 'Helena Prado Vasconcelos',
    email: 'helena@meridiano.org.br',
    role: 'encarregado',
    emailConfirmed: true,
    organizationId: 'org-1',
  })
  inbox()
  router = buildRouter()
  await router.push('/request-queue')
  await router.isReady()
})

function render(role: 'titular' | 'encarregado') {
  return mount(AppShell, {
    props: { role },
    slots: { default: '<p>conteúdo</p>' },
    global: { plugins: [router] },
  })
}

describe('AppShell', () => {
  it('apresenta a organização e a área em que a pessoa está', () => {
    const header = render('encarregado').get('header')

    expect(header.text()).toContain('Instituto Meridiano de Saúde')
    expect(header.text()).toContain('Área do encarregado de proteção de dados')
  })

  it('troca a navegação conforme o perfil, sem trocar de moldura', () => {
    expect(render('titular').get('nav').text()).toContain('Minhas requisições')
    expect(render('encarregado').get('nav').text()).toContain('Fila de atendimento')
  })

  it('conta os avisos não lidos no sino e zera a contagem ao marcar como lidos', async () => {
    const wrapper = render('encarregado')
    await flushPromises()
    const bell = wrapper.get('button[aria-expanded]')

    expect(bell.text()).toContain('3')

    await bell.trigger('click')
    await wrapper.get('button[class*="underline"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('button[aria-expanded]').text()).not.toContain('3')
  })

  it('abre um painel por vez: a conta fecha os avisos', async () => {
    const wrapper = render('encarregado')
    await flushPromises()
    const [bell, account] = wrapper.findAll('button[aria-expanded]')

    await bell!.trigger('click')
    expect(wrapper.text()).toContain('Marcar todas como lidas')

    await account!.trigger('click')
    expect(wrapper.text()).not.toContain('Marcar todas como lidas')
    expect(wrapper.text()).toContain('Perfil: encarregado de proteção de dados')
  })

  it('entrega o conteúdo dentro do <main> alcançável pelo atalho de teclado', () => {
    const main = render('titular').get('main')

    expect(main.attributes('id')).toBe('conteudo-principal')
    expect(main.attributes('tabindex')).toBe('-1')
    expect(main.text()).toContain('conteúdo')
  })
})
