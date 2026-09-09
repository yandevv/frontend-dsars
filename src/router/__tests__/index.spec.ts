import { describe, it, expect } from 'vitest'

import router from '../index'

describe('router', () => {
  it.each([
    ['/', 'home'],
    ['/entrar', 'login'],
    ['/registrar', 'register'],
    ['/recuperar-acesso', 'password-recovery'],
    ['/termos-de-uso', 'terms'],
    ['/aviso-de-privacidade', 'privacy'],
    ['/requisicoes', 'my-requests'],
    ['/requisicoes/nova', 'new-request'],
    ['/requisicoes/01a01f0a-da00-7d89-9fae-9ed1e70505ae', 'my-request-detail'],
    ['/configuracoes', 'settings'],
    ['/configuracoes/dados-pessoais', 'personal-data'],
    ['/configuracoes/seguranca', 'security-settings'],
    ['/configuracoes/notificacoes', 'notification-settings'],
  ])('resolve %s para a rota %s', (path, name) => {
    expect(router.resolve(path).name).toBe(name)
  })

  it('manda endereços desconhecidos para a tela de 404', () => {
    expect(router.resolve('/rota-que-nao-existe').name).toBe('not-found')
  })

  it('leva "Meus dados" do portal do titular aos dados pessoais', async () => {
    await router.push('/meus-dados')
    expect(router.currentRoute.value.name).toBe('personal-data')
  })
})
