import { describe, it, expect } from 'vitest'

import { LEGAL_DEADLINE_DAYS } from '@/features/requests/constants/requestPolicy'
import {
  dueFromReceived,
  isCpfShaped,
  isFutureDay,
  receivedAtOf,
  subjectDocument,
  todayInput,
} from '../onBehalf'
import { daysUntil } from '@/shared/utils/date'

const NOW = new Date(2026, 8, 13, 9, 58)

describe('onBehalf', () => {
  it('escreve hoje no formato do campo de data', () => {
    expect(todayInput(NOW)).toBe('2026-09-13')
  })

  it('recusa só o que é depois de hoje', () => {
    expect(isFutureDay('2026-09-14', NOW)).toBe(true)
    expect(isFutureDay('2026-09-13', NOW)).toBe(false)
    expect(isFutureDay('2026-08-28', NOW)).toBe(false)
  })

  it('usa a hora do registro para o recebimento de hoje', () => {
    expect(receivedAtOf('2026-09-13', NOW)).toBe(NOW.toISOString())
    expect(new Date(receivedAtOf('2026-09-11', NOW)).getDate()).toBe(11)
  })

  it('conta o prazo do recebimento, e não do registro', () => {
    const due = dueFromReceived('2026-08-28', false, NOW)

    expect(daysUntil(due, new Date(2026, 7, 28))).toBe(LEGAL_DEADLINE_DAYS)
    // Uma carta de 16 dias atrás já chega vencida.
    expect(daysUntil(due, NOW)).toBeLessThan(0)
  })

  it('confere o formato do CPF', () => {
    expect(isCpfShaped('318.902.774-10')).toBe(true)
    expect(isCpfShaped('31890277410')).toBe(true)
    expect(isCpfShaped('318.902.774')).toBe(false)
    expect(isCpfShaped('111.111.111-11')).toBe(false)
  })

  it('mascara o CPF como a fila mostra o documento', () => {
    expect(subjectDocument('318.902.774-10')).toBe('CPF ***.902.###-10')
  })
})
