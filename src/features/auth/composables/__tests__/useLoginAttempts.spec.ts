import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { effectScope, nextTick } from 'vue'

import { useLoginAttempts } from '../useLoginAttempts'
import {
  LOGIN_LOCKOUT_MINUTES,
  LOGIN_MAX_ATTEMPTS,
} from '@/features/auth/constants/loginPolicy'

/**
 * O composable registra `onScopeDispose`, que só existe dentro de um escopo.
 * Rodar em um escopo próprio também garante que o intervalo seja encerrado
 * ao fim de cada teste, em vez de vazar para o seguinte.
 */
function inScope<T>(factory: () => T) {
  const scope = effectScope()
  const value = scope.run(factory) as T
  return { value, stop: () => scope.stop() }
}

describe('useLoginAttempts', () => {
  let stop: () => void

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    stop?.()
    vi.useRealTimers()
  })

  function setup() {
    const scoped = inScope(() => useLoginAttempts())
    stop = scoped.stop
    return scoped.value
  }

  it('começa sem tentativas e sem bloqueio', () => {
    const attempts = setup()

    expect(attempts.attempts.value).toBe(0)
    expect(attempts.remaining.value).toBe(LOGIN_MAX_ATTEMPTS)
    expect(attempts.isLocked.value).toBe(false)
  })

  it('desconta as tentativas restantes a cada recusa', () => {
    const attempts = setup()

    attempts.registerFailure()
    expect(attempts.attempts.value).toBe(1)
    expect(attempts.remaining.value).toBe(LOGIN_MAX_ATTEMPTS - 1)

    attempts.registerFailure()
    expect(attempts.remaining.value).toBe(LOGIN_MAX_ATTEMPTS - 2)
    expect(attempts.isLocked.value).toBe(false)
  })

  it('bloqueia exatamente na última tentativa permitida (RN008)', async () => {
    const attempts = setup()

    for (let i = 0; i < LOGIN_MAX_ATTEMPTS - 1; i += 1) attempts.registerFailure()
    expect(attempts.isLocked.value).toBe(false)

    attempts.registerFailure()
    await nextTick()

    expect(attempts.isLocked.value).toBe(true)
    expect(attempts.countdown.value).toBe(`${LOGIN_LOCKOUT_MINUTES}:00`)
  })

  it('mostra a contagem regressiva correndo a cada segundo', async () => {
    const attempts = setup()

    for (let i = 0; i < LOGIN_MAX_ATTEMPTS; i += 1) attempts.registerFailure()
    await nextTick()

    vi.advanceTimersByTime(1000)
    await nextTick()
    expect(attempts.countdown.value).toBe('14:59')

    vi.advanceTimersByTime(59_000)
    await nextTick()
    expect(attempts.countdown.value).toBe('14:00')
  })

  it('libera a conta sozinha quando o tempo acaba, sem recarregar a página', async () => {
    const attempts = setup()

    for (let i = 0; i < LOGIN_MAX_ATTEMPTS; i += 1) attempts.registerFailure()
    await nextTick()
    expect(attempts.isLocked.value).toBe(true)

    vi.advanceTimersByTime(LOGIN_LOCKOUT_MINUTES * 60_000)
    await nextTick()

    expect(attempts.isLocked.value).toBe(false)
    expect(attempts.attempts.value).toBe(0)
    expect(attempts.remaining.value).toBe(LOGIN_MAX_ATTEMPTS)
  })

  it('zera a contagem quando o acesso é bem-sucedido', async () => {
    const attempts = setup()

    attempts.registerFailure()
    attempts.registerFailure()
    attempts.reset()
    await nextTick()

    expect(attempts.attempts.value).toBe(0)
    expect(attempts.isLocked.value).toBe(false)
  })
})
