import { describe, it, expect, vi, beforeEach } from 'vitest'

import * as auditService from '../auditService'
import { DEMO_REQUESTS } from '@/features/requests/data/requests'
import { savePreferences } from '@/features/settings/services/notificationPreferencesService'
import { defaultPreferences } from '@/features/settings/constants/notificationEvents'

vi.mock('@/features/auth/services/fakeNetwork', () => ({ delay: () => Promise.resolve() }))

const { listAuditEntries, recordAccountEvent, resetAudit } = auditService

describe('auditService', () => {
  beforeEach(() => resetAudit())

  it('junta o histórico de todas as requisições aos eventos de conta', async () => {
    const entries = await listAuditEntries()
    const timelineSize = DEMO_REQUESTS.reduce((sum, request) => sum + request.timeline.length, 0)

    expect(entries.filter((entry) => entry.resource.kind === 'requisicao').length).toBeGreaterThanOrEqual(
      timelineSize,
    )
    expect(entries.some((entry) => entry.operation === 'negado')).toBe(true)
  })

  it('liga o registro à requisição e identifica o titular pelo nome', async () => {
    const request = DEMO_REQUESTS.find((item) => item.protocol === '2026-000418')!
    const entries = await listAuditEntries()
    const created = entries.find(
      (entry) => entry.resource.requestId === request.id && entry.operation === 'criacao',
    )!

    expect(created.resource.label).toBe('2026-000418')
    expect(created.actor).toBe(request.subject.name)
    expect(created.actorRole).toBe('titular')
    expect(created.origin).toBe('Portal do titular')
  })

  it('ordena do mais recente para o mais antigo', async () => {
    const entries = await listAuditEntries()
    const times = entries.map((entry) => entry.at)

    expect(times).toEqual([...times].sort().reverse())
  })

  it('acrescenta eventos de conta com o nome de quem agiu', async () => {
    recordAccountEvent(
      { email: 'titular@exemplo.com.br' },
      { operation: 'alteracao', action: 'Telefone alterado', detail: 'Teste.' },
    )

    const [latest] = await listAuditEntries()
    expect(latest).toMatchObject({
      actor: 'Marina Torres de Almeida',
      actorRole: 'titular',
      action: 'Telefone alterado',
      resource: { kind: 'conta', label: 'Conta de Marina Torres de Almeida' },
    })
  })

  it('registra a troca de preferências feita nas configurações', async () => {
    await savePreferences('titular@exemplo.com.br', defaultPreferences())

    const [latest] = await listAuditEntries()
    expect(latest!.action).toBe('Preferências de notificação alteradas')
  })

  it('não oferece como editar nem excluir um registro', () => {
    const names = Object.keys(auditService)
    expect(names.filter((name) => /update|edit|delete|remove/i.test(name))).toEqual([])
  })
})
