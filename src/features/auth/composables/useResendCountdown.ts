import { computed, onScopeDispose, ref, toValue, type MaybeRefOrGetter } from 'vue'

/**
 * Contagem regressiva até o próximo envio permitido.
 *
 * Recebe o instante do último envio e o intervalo mínimo; devolve quantos
 * segundos faltam e o texto "04:59" que o botão mostra. O relógio anda uma vez
 * por segundo só enquanto há espera.
 */
export function useResendCountdown(
  lastSentAt: MaybeRefOrGetter<number | undefined>,
  intervalSeconds: number,
  clock: () => number = Date.now,
) {
  const now = ref(clock())
  const timer = setInterval(() => {
    now.value = clock()
  }, 1000)
  onScopeDispose(() => clearInterval(timer))

  const remaining = computed(() => {
    const sent = toValue(lastSentAt)
    if (sent === undefined) return 0
    return Math.max(0, Math.ceil(intervalSeconds - (now.value - sent) / 1000))
  })

  const waiting = computed(() => remaining.value > 0)

  const label = computed(() => {
    const minutes = String(Math.floor(remaining.value / 60)).padStart(2, '0')
    const seconds = String(remaining.value % 60).padStart(2, '0')
    return `${minutes}:${seconds}`
  })

  /** Atualiza o relógio na hora — depois de um envio, sem esperar o próximo tique. */
  function tick() {
    now.value = clock()
  }

  return { remaining, waiting, label, tick }
}
