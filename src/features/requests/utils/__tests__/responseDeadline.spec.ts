import { describe, it, expect } from 'vitest'

import {
  deadlinePhrase,
  dueAtFor,
  formatDue,
  isImmediate,
  needsAccessFormat,
  requestIsImmediate,
  responseFormatFor,
} from '../responseDeadline'
import { daysUntil } from '@/shared/utils/date'

const REGISTERED = '2026-09-13T23:50:00.000Z'
const hoursBetween = (from: string, to: string) =>
  (new Date(to).getTime() - new Date(from).getTime()) / 3_600_000

describe('responseDeadline', () => {
  it('trata como imediatas a confirmação e o acesso simplificado', () => {
    expect(isImmediate('I')).toBe(true)
    expect(isImmediate('II', 'simplificado')).toBe(true)
    expect(isImmediate('II', 'completo')).toBe(false)
    expect(isImmediate('II')).toBe(false)
    expect(isImmediate('VI')).toBe(false)
  })

  it('dá 24 horas a partir do registro, seja qual for a hora', () => {
    expect(hoursBetween(REGISTERED, dueAtFor(REGISTERED, 'I'))).toBe(24)
    expect(hoursBetween(REGISTERED, dueAtFor(REGISTERED, 'II', 'simplificado'))).toBe(24)
  })

  it('dá 15 dias à declaração completa e aos demais direitos', () => {
    const now = new Date(REGISTERED)
    expect(daysUntil(dueAtFor(REGISTERED, 'II', 'completo'), now)).toBe(15)
    expect(daysUntil(dueAtFor(REGISTERED, 'III'), now)).toBe(15)
  })

  it('escreve o prazo e o vencimento como a tela mostra', () => {
    expect(deadlinePhrase(true)).toBe('Em até 24 horas')
    expect(deadlinePhrase(false)).toBe('15 dias')
    expect(formatDue(REGISTERED, true)).toMatch(/\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}/)
    expect(formatDue(REGISTERED, false)).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
  })

  it('pede o formato só no acesso aos dados', () => {
    expect(needsAccessFormat('II')).toBe(true)
    expect(needsAccessFormat('I')).toBe(false)
  })
})

describe('prazo de um pedido já registrado', () => {
  const HOUR = 3_600_000
  const at = (ms: number) => new Date(Date.UTC(2026, 8, 26, 12) + ms).toISOString()

  it('lê o prazo que o servidor calculou, e não o direito', () => {
    expect(requestIsImmediate({ registeredAt: at(0), dueAt: at(24 * HOUR) })).toBe(true)
    expect(requestIsImmediate({ registeredAt: at(0), dueAt: at(15 * 24 * HOUR) })).toBe(false)
  })

  it('envia o formato simplificado na confirmação e o escolhido no acesso', () => {
    expect(responseFormatFor('I')).toBe('simplificado')
    expect(responseFormatFor('II', 'simplificado')).toBe('simplificado')
    expect(responseFormatFor('II')).toBe('completo')
    expect(responseFormatFor('VI')).toBeUndefined()
  })
})
