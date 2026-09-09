import { describe, it, expect } from 'vitest'

import { formatPhone, isValidPhone, maskDocument, maskPhone } from '../mask'

describe('máscaras dos dados de identificação', () => {
  it('mostra do CPF só os três dígitos do meio', () => {
    expect(maskDocument('476.201.789-04')).toBe('•••.•••.789-••')
    expect(maskDocument('47620178904')).toBe('•••.•••.789-••')
  })

  it('esconde o CPF inteiro quando ele não tem onze dígitos', () => {
    expect(maskDocument('')).not.toMatch(/\d/)
  })

  it('mostra do telefone só os quatro últimos dígitos', () => {
    expect(maskPhone('(16) 99482-3071')).toBe('(••) •••••-3071')
    expect(maskPhone('(16) 3721-4410')).toBe('(••) ••••-4410')
  })

  it('aceita telefone com DDD, fixo ou celular, e o formata', () => {
    expect(isValidPhone('16 99482 3071')).toBe(true)
    expect(isValidPhone('1637214410')).toBe(true)
    expect(isValidPhone('99482-3071')).toBe(false)
    expect(formatPhone('16994823071')).toBe('(16) 99482-3071')
    expect(formatPhone('1637214410')).toBe('(16) 3721-4410')
  })
})
