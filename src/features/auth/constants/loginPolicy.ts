/** Tentativas seguidas sem sucesso antes do bloqueio (RN008). */
export const LOGIN_MAX_ATTEMPTS = 5

/** Duração do bloqueio, em minutos (RN008). */
export const LOGIN_LOCKOUT_MINUTES = 15

/** Inatividade que encerra a sessão comum (RN010). */
export const SESSION_IDLE_MINUTES = 30

/** Validade da sessão com "manter-me conectado" marcado. */
export const SESSION_PERSISTENT_DAYS = 7

const NUMBER_WORDS = [
  'zero',
  'uma',
  'duas',
  'três',
  'quatro',
  'cinco',
  'seis',
  'sete',
  'oito',
  'nove',
  'dez',
]

/**
 * Número por extenso, no feminino, para caber em "houve cinco tentativas".
 *
 * A mensagem de bloqueio cita o limite dentro de uma frase corrida, e um
 * algarismo no meio dela destoaria do resto do texto.
 */
export function attemptsInWords(count: number): string {
  return NUMBER_WORDS[count] ?? String(count)
}
