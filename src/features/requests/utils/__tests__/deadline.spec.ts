import { describe, it, expect } from 'vitest'

import { daysLeft, deadlineLabel, deadlineStatusOf } from '../deadline'
import { daysFromNow } from '@/shared/utils/date'
import type { DataRequest, RequestStatus } from '@/features/requests/types/request'

function request(dueInDays: number, status: RequestStatus = 'em-analise'): DataRequest {
  return {
    protocol: '2026-000001',
    id: 'req_0',
    rightNumeral: 'II',
    description: 'pedido',
    status,
    subject: { name: 'Marina Torres de Almeida', email: 'titular@exemplo.com.br' },
    registeredAt: daysFromNow(dueInDays - 15),
    dueAt: daysFromNow(dueInDays),
    channel: 'Portal do titular',
    attachments: [],
    timeline: [],
    notes: [],
  }
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

  it('mantém o prazo correndo enquanto se espera o titular', () => {
    // O art. 19 não suspende a contagem por pedido de complemento, e a leitura
    // conservadora é a que a autoridade tende a adotar.
    expect(deadlineStatusOf(request(-1, 'aguardando-complemento'))).toBe('vencida')
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
})
