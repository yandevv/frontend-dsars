/** Locale único do portal: o público é brasileiro e a LGPD é lei nacional. */
const LOCALE = 'pt-BR'

/** Data no formato dd/mm/aaaa, a partir do texto ISO que a API devolve. */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/** Data e hora, para quando o horário importa — o vencimento de um link. */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
