import { LEGAL_DEADLINE_DAYS } from '@/features/requests/constants/requestPolicy'
import { addDays } from '@/shared/utils/date'

/**
 * Datas e documentos do registro por terceiro.
 *
 * O campo de data devolve só o dia (aaaa-mm-dd), sem hora nem fuso; tudo aqui
 * lê esse texto no fuso de quem registra, que é o da unidade onde o pedido
 * chegou.
 */

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

/** Hoje no formato do campo de data — o limite do recebimento. */
export function todayInput(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

/** Recebimento depois de hoje adiaria o prazo legal, e por isso é recusado. */
export function isFutureDay(day: string, now: Date = new Date()): boolean {
  return day > todayInput(now)
}

/**
 * O momento do recebimento em ISO. Recebido hoje vale a hora do registro; um
 * dia passado vale o meio-dia, que não troca de data em nenhum fuso do país.
 */
export function receivedAtOf(day: string, now: Date = new Date()): string {
  if (day === todayInput(now)) return now.toISOString()
  return new Date(`${day}T12:00:00`).toISOString()
}

/** O prazo legal, contado do dia em que o pedido chegou e não do registro. */
export function dueFromReceived(day: string, now: Date = new Date()): string {
  return addDays(receivedAtOf(day, now), LEGAL_DEADLINE_DAYS)
}

/** Só os algarismos do CPF. */
export function cpfDigits(cpf: string): string {
  return cpf.replace(/\D/g, '')
}

/** Onze algarismos, e não todos iguais — "111.111.111-11" é o CPF de ninguém. */
export function isCpfShaped(cpf: string): boolean {
  const digits = cpfDigits(cpf)
  return digits.length === 11 && !/^(\d)\1{10}$/.test(digits)
}

/** "318.902.774-10" → "CPF ***.902.###-10", como a fila mostra o documento. */
export function subjectDocument(cpf: string): string {
  const digits = cpfDigits(cpf)
  return `CPF ***.${digits.slice(3, 6)}.###-${digits.slice(9)}`
}
