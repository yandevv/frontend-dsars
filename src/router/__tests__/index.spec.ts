import { describe, it, expect } from 'vitest'

import router from '../index'
import { endSession, startSession } from '@/features/auth/composables/useSession'

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
    startSession({
      id: 'conta-1',
      name: 'Marina Torres de Almeida',
      email: 'marina@exemplo.com.br',
      role: 'titular',
      emailConfirmed: true,
    })
    await router.push('/meus-dados')
    expect(router.currentRoute.value.name).toBe('personal-data')
  })

  it('manda ao acesso, guardando o destino, quem abre tela restrita sem sessão', async () => {
    endSession()
    await router.push('/requisicoes')
    expect(router.currentRoute.value.name).toBe('login')
    expect(router.currentRoute.value.query.redirect).toBe('/requisicoes')
  })

  it('leva o titular que abre a área do encarregado ao próprio ambiente', async () => {
    startSession({
      id: 'conta-1',
      name: 'Marina Torres de Almeida',
      email: 'marina@exemplo.com.br',
      role: 'titular',
      emailConfirmed: true,
    })
    await router.push('/painel/fila')
    expect(router.currentRoute.value.name).toBe('my-requests')
  })

  it('resolve os endereços que chegam nos e-mails', () => {
    expect(router.resolve('/confirmar-email?token=abc').name).toBe('email-confirmation')
    expect(router.resolve('/confirmar-novo-email?token=abc').name).toBe('email-change-confirmation')
    expect(router.resolve('/redefinir-senha?token=abc').name).toBe('password-reset')
    expect(router.resolve('/convites/abc').name).toBe('invite')
    expect(router.resolve('/convite/abc').name).toBe('invite')
    expect(router.resolve('/entrar/google/erro?motivo=falha').name).toBe('google-error')
  })
})
