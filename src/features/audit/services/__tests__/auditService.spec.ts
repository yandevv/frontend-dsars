import { describe, it, expect, vi, beforeEach } from 'vitest'

import * as auditService from '../auditService'
import { titularRequests } from '@/test/factories'

vi.mock('@/features/requests/services/requestService', async () => {
  const { titularRequests: requests } = await import('@/test/factories')
  return { listOrganizationRequests: () => Promise.resolve(requests()) }
})

const { fromRequest, listAuditEntries, recordAccountEvent, resetAudit } = auditService

describe('auditService', () => {
  beforeEach(() => resetAudit())

  it('registra a criação de cada requisição e o encerramento das que saíram da fila', async () => {
    const entries = await listAuditEntries()

    expect(entries.filter((entry) => entry.operation === 'criacao')).toHaveLength(5)
    expect(entries.map((entry) => entry.action)).toContain('Atendimento finalizado')
    expect(entries.map((entry) => entry.action)).toContain('Requisição cancelada pelo titular')
  })

  it('liga o registro à requisição e identifica o titular pelo nome', () => {
    const request = titularRequests()[0]!
    const [created] = fromRequest(request)

    expect(created).toMatchObject({
      operation: 'criacao',
      actor: request.subject.name,
      actorRole: 'titular',
      origin: 'Portal do titular',
      resource: { kind: 'requisicao', label: '2026-000418', requestId: request.id },
    })
  })

  it('ordena do mais recente para o mais antigo', async () => {
    const entries = await listAuditEntries()
    const times = entries.map((entry) => entry.at)

    expect(times).toEqual([...times].sort().reverse())
  })

  it('acrescenta os eventos da sessão com o nome de quem agiu', async () => {
    recordAccountEvent(
      { email: 'helena@meridiano.org.br', name: 'Helena Prado Vasconcelos', role: 'encarregado' },
      { operation: 'exportacao', action: 'Fila de atendimento exportada', detail: 'Teste.' },
    )

    const [latest] = await listAuditEntries()
    expect(latest).toMatchObject({
      actor: 'Helena Prado Vasconcelos',
      actorRole: 'encarregado',
      action: 'Fila de atendimento exportada',
      origin: 'Área do encarregado',
    })
  })

  it('não oferece como editar nem excluir um registro', () => {
    const names = Object.keys(auditService)
    expect(names.filter((name) => /update|edit|delete|remove/i.test(name))).toEqual([])
  })
})
