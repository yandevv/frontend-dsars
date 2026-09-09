/**
 * Máscaras dos dados de identificação.
 *
 * Deixam à vista só o suficiente para a pessoa reconhecer o próprio dado — os
 * três dígitos do meio do CPF e o fim do telefone —, o que evita exposição em
 * tela compartilhada e em captura enviada ao suporte.
 */
const DOT = '•'

/** "476.201.789-04" → "•••.•••.789-••" */
export function maskDocument(cpf: string): string {
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11) return `${DOT.repeat(3)}.${DOT.repeat(3)}.${DOT.repeat(3)}-${DOT.repeat(2)}`
  return `${DOT.repeat(3)}.${DOT.repeat(3)}.${digits.slice(6, 9)}-${DOT.repeat(2)}`
}

/** "(11) 96482-3071" → "(••) •••••-3071" */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 4) return DOT.repeat(4)
  const prefix = digits.length === 11 ? DOT.repeat(5) : DOT.repeat(4)
  return `(${DOT.repeat(2)}) ${prefix}-${digits.slice(-4)}`
}

/** Só algarismos, com DDD: 10 dígitos para fixo, 11 para celular. */
export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '')
  return digits.length === 10 || digits.length === 11
}

/** "11964823071" → "(11) 96482-3071" */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return phone.trim()
}
