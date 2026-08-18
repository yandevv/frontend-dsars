import { describe, it, expect } from 'vitest'

import router from '../index'

describe('router', () => {
  it.each([
    ['/', 'home'],
    ['/entrar', 'login'],
    ['/registrar', 'register'],
    ['/termos-de-uso', 'terms'],
    ['/aviso-de-privacidade', 'privacy'],
  ])('resolve %s para a rota %s', (path, name) => {
    expect(router.resolve(path).name).toBe(name)
  })

  it('manda endereços desconhecidos para a tela de 404', () => {
    expect(router.resolve('/rota-que-nao-existe').name).toBe('not-found')
  })
})
