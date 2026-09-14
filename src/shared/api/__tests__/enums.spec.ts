import { describe, it, expect } from 'vitest'

import {
  apiDeadlineOf,
  apiFormatOf,
  apiStatusOf,
  deadlineOf,
  formatOf,
  numeralOf,
  rightOf,
  statusOf,
} from '../enums'

describe('enums', () => {
  it('liga cada direito da API ao inciso do art. 18, nos dois sentidos', () => {
    expect(numeralOf('PROCESSING_CONFIRMATION')).toBe('I')
    expect(numeralOf('DATA_ACCESS')).toBe('II')
    expect(numeralOf('CONSENT_REVOCATION')).toBe('IX')
    for (const numeral of ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX']) {
      expect(numeralOf(rightOf(numeral))).toBe(numeral)
    }
  })

  it('recusa um inciso que não existe', () => {
    expect(() => rightOf('X')).toThrow(RangeError)
  })

  it('traduz estados, situações de prazo e formatos', () => {
    expect(statusOf('OPEN')).toBe('aberta')
    expect(apiStatusOf('cancelada')).toBe('CANCELLED')
    expect(deadlineOf('DUE_SOON')).toBe('proxima')
    expect(apiDeadlineOf('vencida')).toBe('OVERDUE')
    expect(formatOf('SIMPLIFIED')).toBe('simplificado')
    expect(apiFormatOf('completo')).toBe('COMPLETE')
  })
})
