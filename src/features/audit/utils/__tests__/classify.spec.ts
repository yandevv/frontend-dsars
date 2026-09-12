import { describe, it, expect } from 'vitest'

import { operationOf } from '../classify'

describe('operationOf', () => {
  it('lê criação, mudança de estado e acesso pelo título do histórico', () => {
    expect(operationOf('Requisição registrada')).toBe('criacao')
    expect(operationOf('Requisição registrada em nome do titular')).toBe('criacao')
    expect(operationOf('Requisição cancelada pelo titular')).toBe('transicao')
    expect(operationOf('Atendimento finalizado · Atendido')).toBe('transicao')
    expect(operationOf('Complemento solicitado ao titular')).toBe('transicao')
    expect(operationOf('Identidade verificada')).toBe('acesso')
    expect(operationOf('Arquivo de portabilidade gerado')).toBe('acesso')
  })

  it('trata o resto como alteração', () => {
    expect(operationOf('Mensagem editada')).toBe('alteracao')
    expect(operationOf('Requisição reatribuída')).toBe('alteracao')
  })
})
