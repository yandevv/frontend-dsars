import { describe, it, expect, afterEach, vi } from 'vitest'
import { effectScope } from 'vue'

import { REVEAL_SECONDS, useReveal } from '../useReveal'

describe('useReveal', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('revela e oculta por ação explícita', () => {
    const scope = effectScope()
    const reveal = scope.run(() => useReveal())!

    expect(reveal.isRevealed('document')).toBe(false)
    reveal.toggle('document')
    expect(reveal.isRevealed('document')).toBe(true)
    reveal.toggle('document')
    expect(reveal.isRevealed('document')).toBe(false)
    scope.stop()
  })

  it('volta a mascarar sozinho depois de 30 segundos', () => {
    vi.useFakeTimers()
    const scope = effectScope()
    const reveal = scope.run(() => useReveal())!

    reveal.toggle('phone')
    vi.advanceTimersByTime((REVEAL_SECONDS - 1) * 1000)
    expect(reveal.isRevealed('phone')).toBe(true)

    vi.advanceTimersByTime(1000)
    expect(reveal.isRevealed('phone')).toBe(false)
    scope.stop()
  })

  it('cada dado tem o próprio relógio', () => {
    vi.useFakeTimers()
    const scope = effectScope()
    const reveal = scope.run(() => useReveal())!

    reveal.toggle('document')
    vi.advanceTimersByTime(20_000)
    reveal.toggle('phone')
    vi.advanceTimersByTime(10_000)

    expect(reveal.isRevealed('document')).toBe(false)
    expect(reveal.isRevealed('phone')).toBe(true)
    scope.stop()
  })
})
