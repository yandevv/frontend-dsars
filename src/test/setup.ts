import { beforeEach, vi } from 'vitest'

/**
 * Nenhum teste de unidade fala com a API de verdade. Quem precisa de resposta
 * simula `@/shared/api/http` ou substitui o `fetch`; o resto recebe uma falha
 * de rede, como se o servidor estivesse fora do ar.
 */
beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.reject(new TypeError('Rede indisponível nos testes.'))),
  )
})
