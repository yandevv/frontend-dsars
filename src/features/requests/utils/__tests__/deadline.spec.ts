import { describe, it, expect } from 'vitest'

import { daysLeft, deadlineLabel, deadlineStatusOf } from '../deadline'
import { daysFromNow } from '@/shared/utils/date'
import { makeRequest } from '@/test/factories'
import type { DataRequest, RequestStatus } from '@/features/requests/types/request'

function request(dueInDays: number, status: RequestStatus = 'aberta'): DataRequest {
  return makeRequest({
    rightNumeral: 'II',
    status,
    registeredAt: daysFromNow(dueInDays - 15),
    dueAt: daysFromNow(dueInDays),
  })
}

describe('situação do prazo', () => {
  it('separa vencida, próxima do vencimento e em dia', () => {
    expect(deadlineStatusOf(request(-1))).toBe('vencida')
    expect(deadlineStatusOf(request(0))).toBe('proxima')
    expect(deadlineStatusOf(request(3))).toBe('proxima')
    expect(deadlineStatusOf(request(4))).toBe('em-dia')
  })

  it('não calcula prazo de requisição que saiu da fila', () => {
    expect(deadlineStatusOf(request(-9, 'concluida'))).toBe('encerrada')
    expect(deadlineStatusOf(request(-9, 'cancelada'))).toBe('encerrada')
  })

  it('escreve o prazo como a fila o anuncia', () => {
    expect(deadlineLabel(request(-2))).toBe('Venceu há 2 dias')
    expect(deadlineLabel(request(-1))).toBe('Venceu ontem')
    expect(deadlineLabel(request(0))).toBe('Vence hoje')
    expect(deadlineLabel(request(1))).toBe('Falta 1 dia')
    expect(deadlineLabel(request(9))).toBe('Faltam 9 dias')
    expect(deadlineLabel(request(-9, 'concluida'))).toBe('Respondida')
    expect(deadlineLabel(request(-9, 'cancelada'))).toBe('Cancelada pelo titular')
  })

  it('conta por virada de calendário, não por períodos de 24 horas', () => {
    const late = request(0)
    // Vence hoje às 23:59; às 8 da manhã ainda resta o dia inteiro, não zero.
    expect(daysLeft(late)).toBe(0)
  })

  describe('prazo de 24 horas', () => {
    const NOW = new Date('2026-09-26T12:00:00.000Z')
    const HOUR = 3_600_000

    function immediate(hoursLeft: number, status: RequestStatus = 'aberta'): DataRequest {
      const due = NOW.getTime() + hoursLeft * HOUR
      return {
        ...request(0, status),
        rightNumeral: 'I',
        registeredAt: new Date(due - 24 * HOUR).toISOString(),
        dueAt: new Date(due).toISOString(),
      }
    }

    it('fica perto do fim até vencer, e vence no minuto exato', () => {
      expect(deadlineStatusOf(immediate(23), NOW)).toBe('proxima')
      expect(deadlineStatusOf(immediate(0.01), NOW)).toBe('proxima')
      expect(deadlineStatusOf(immediate(-0.01), NOW)).toBe('vencida')
    })

    it('anuncia o prazo em horas', () => {
      expect(deadlineLabel(immediate(5.5), NOW)).toBe('Vence em 5 h')
      expect(deadlineLabel(immediate(0.5), NOW)).toBe('Vence em menos de 1 h')
      expect(deadlineLabel(immediate(-0.5), NOW)).toBe('Venceu há menos de 1 h')
      expect(deadlineLabel(immediate(-3), NOW)).toBe('Venceu há 3 h')
      expect(deadlineLabel(immediate(-30), NOW)).toBe('Venceu há 1 dia')
      expect(deadlineLabel(immediate(-72), NOW)).toBe('Venceu há 3 dias')
    })

    it('ordena pela fração de dia que falta', () => {
      expect(daysLeft(immediate(6), NOW)).toBe(0.25)
    })
  })
})
