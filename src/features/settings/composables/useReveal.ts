import { onScopeDispose, ref } from 'vue'

/** Por quanto tempo um dado revelado fica à vista antes de voltar à máscara. */
export const REVEAL_SECONDS = 30

/**
 * Revelar um dado mascarado é uma ação explícita e temporária.
 *
 * O dado volta a ocultar sozinho depois de meio minuto: quem revelou o CPF
 * para conferir não deveria deixá-lo exposto até lembrar de clicar em ocultar.
 */
export function useReveal(
  seconds: number = REVEAL_SECONDS,
  /** Revelar é acesso a dado pessoal: a tela avisa quem registra. */
  onReveal?: (key: string) => void,
) {
  const revealed = ref<Set<string>>(new Set())
  const timers = new Map<string, ReturnType<typeof setTimeout>>()

  function hide(key: string) {
    clearTimeout(timers.get(key))
    timers.delete(key)
    const next = new Set(revealed.value)
    next.delete(key)
    revealed.value = next
  }

  function reveal(key: string) {
    revealed.value = new Set(revealed.value).add(key)
    onReveal?.(key)
    clearTimeout(timers.get(key))
    timers.set(
      key,
      setTimeout(() => hide(key), seconds * 1000),
    )
  }

  function toggle(key: string) {
    if (revealed.value.has(key)) hide(key)
    else reveal(key)
  }

  onScopeDispose(() => timers.forEach((timer) => clearTimeout(timer)))

  return { isRevealed: (key: string) => revealed.value.has(key), toggle }
}
