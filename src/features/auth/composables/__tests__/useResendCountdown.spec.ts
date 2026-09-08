import { describe, it, expect, afterEach, vi } from 'vitest'
import { effectScope, ref } from 'vue'

import { useResendCountdown } from '../useResendCountdown'

describe('useResendCountdown', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('sem envio registrado, não há espera', () => {
    const scope = effectScope()
    const countdown = scope.run(() => useResendCountdown(undefined, 300))!

    expect(countdown.waiting.value).toBe(false)
    expect(countdown.label.value).toBe('00:00')
    scope.stop()
  })

  it('conta os minutos e segundos que faltam e libera ao fim', () => {
    vi.useFakeTimers()
    vi.setSystemTime(Date.UTC(2026, 8, 25, 10, 0, 0))
    const sentAt = ref<number | undefined>(Date.now())

    const scope = effectScope()
    const countdown = scope.run(() => useResendCountdown(sentAt, 300))!
    expect(countdown.label.value).toBe('05:00')

    vi.advanceTimersByTime(61_000)
    expect(countdown.label.value).toBe('03:59')
    expect(countdown.waiting.value).toBe(true)

    vi.advanceTimersByTime(240_000)
    expect(countdown.waiting.value).toBe(false)
    scope.stop()
  })
})
