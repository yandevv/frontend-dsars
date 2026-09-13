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

const DAY_MS = 86_400_000

function startOfDay(date: Date): Date {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

/** Texto ISO de uma data a `days` dias de hoje — negativo para o passado. */
export function daysFromNow(days: number): string {
  return new Date(Date.now() + days * DAY_MS).toISOString()
}

/** Mesmo instante, deslocado em horas. */
export function addHours(iso: string, hours: number): string {
  return new Date(new Date(iso).getTime() + hours * 3_600_000).toISOString()
}

/** Mesma data, deslocada em dias corridos. */
export function addDays(iso: string, days: number): string {
  return new Date(new Date(iso).getTime() + days * DAY_MS).toISOString()
}

/**
 * Dias corridos entre hoje e a data, contados por virada de calendário.
 *
 * Dividir a diferença em milissegundos erraria por um dia sempre que as duas
 * pontas caíssem em horas diferentes — e prazo legal se conta em dias, não em
 * períodos de 24 horas.
 */
export function daysUntil(iso: string, from: Date = new Date()): number {
  return Math.round(
    (startOfDay(new Date(iso)).getTime() - startOfDay(from).getTime()) / DAY_MS,
  )
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' })
}

/**
 * O momento em linguagem corrente, como a lista de avisos o escreve:
 * "Hoje, 07:00", "Ontem, 18:40" ou "02/09/2026, 11:20".
 */
export function relativeMoment(iso: string, now: Date = new Date()): string {
  const date = new Date(iso)
  const days = daysUntil(iso, now)
  if (days === 0) return `Hoje, ${formatTime(date)}`
  if (days === -1) return `Ontem, ${formatTime(date)}`
  return formatDateTime(iso)
}

/** O rótulo do grupo em que o aviso cai: "Hoje", "Ontem" ou o mês, "Setembro de 2026". */
export function momentGroup(iso: string, now: Date = new Date()): string {
  const days = daysUntil(iso, now)
  if (days === 0) return 'Hoje'
  if (days === -1) return 'Ontem'
  const label = new Date(iso).toLocaleDateString(LOCALE, { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}
