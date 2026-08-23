import { computed, onScopeDispose, ref, watch, type ComputedRef, type Ref } from 'vue'

import { LOGIN_LOCKOUT_MINUTES, LOGIN_MAX_ATTEMPTS } from '@/features/auth/constants/loginPolicy'

interface LoginAttempts {
  /** Tentativas seguidas sem sucesso. */
  attempts: Readonly<Ref<number>>
  /** Quantas ainda restam antes do bloqueio. */
  remaining: ComputedRef<number>
  isLocked: ComputedRef<boolean>
  /** Tempo restante do bloqueio, no formato MM:SS. */
  countdown: ComputedRef<string>
  /** Registra uma recusa de credenciais; bloqueia ao atingir o limite. */
  registerFailure: () => void
  /** Zera a contagem — no acesso bem-sucedido ou ao fim do bloqueio. */
  reset: () => void
}

function formatCountdown(ms: number): string {
  const total = Math.max(0, ms)
  const minutes = Math.floor(total / 60_000)
  const seconds = Math.floor((total % 60_000) / 1000)
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

/**
 * Contagem de tentativas e bloqueio temporário do RN008.
 *
 * O relógio só corre enquanto há bloqueio: fora dele não existe intervalo
 * ligado, e a contagem regressiva vem de `Date.now()` em vez de um contador
 * próprio — uma aba em segundo plano recebe menos disparos de `setInterval`, e
 * um contador decrescente ficaria atrasado em relação ao relógio real.
 */
export function useLoginAttempts(): LoginAttempts {
  const attempts = ref(0)
  const lockedUntil = ref(0)
  const now = ref(Date.now())

  let timer: ReturnType<typeof setInterval> | undefined

  function stopClock() {
    if (timer !== undefined) {
      clearInterval(timer)
      timer = undefined
    }
  }

  const remainingMs = computed(() => Math.max(0, lockedUntil.value - now.value))
  const isLocked = computed(() => remainingMs.value > 0)
  const countdown = computed(() => formatCountdown(remainingMs.value))
  const remaining = computed(() => Math.max(0, LOGIN_MAX_ATTEMPTS - attempts.value))

  function reset() {
    attempts.value = 0
    lockedUntil.value = 0
    stopClock()
  }

  function registerFailure() {
    attempts.value += 1
    if (attempts.value < LOGIN_MAX_ATTEMPTS) return

    now.value = Date.now()
    lockedUntil.value = now.value + LOGIN_LOCKOUT_MINUTES * 60_000
  }

  watch(lockedUntil, (value) => {
    stopClock()
    if (value > 0) {
      timer = setInterval(() => {
        now.value = Date.now()
      }, 1000)
    }
  })

  // Cumprido o tempo, a conta volta a aceitar tentativas — sem exigir recarga.
  watch(isLocked, (locked) => {
    if (!locked && lockedUntil.value > 0) reset()
  })

  onScopeDispose(stopClock)

  return { attempts, remaining, isLocked, countdown, registerFailure, reset }
}
