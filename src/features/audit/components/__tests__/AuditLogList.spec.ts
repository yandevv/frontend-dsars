import { describe, it, expect } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'

import AuditLogList from '../AuditLogList.vue'
import type { AuditEntry } from '@/features/audit/types/audit'

const entries: AuditEntry[] = [
  {
    id: '1',
    at: new Date().toISOString(),
    actor: 'Beatriz Falcão Ribeiro',
    actorRole: 'encarregado',
    operation: 'alteracao',
    action: 'Mensagem editada',
    detail: 'Texto anterior: “Olá”',
    resource: { kind: 'requisicao', label: '2026-000418', requestId: 'abc' },
    origin: 'Área do encarregado',
  },
  {
    id: '2',
    at: new Date().toISOString(),
    actor: 'Marina Torres de Almeida',
    actorRole: 'titular',
    operation: 'negado',
    action: 'Tentativa de acesso à área do encarregado',
    detail: 'Recusado.',
    resource: { kind: 'area-restrita', label: 'Fila de atendimento' },
    origin: 'Portal do titular',
  },
]

function render() {
  return mount(AuditLogList, {
    props: { entries },
    global: { stubs: { RouterLink: RouterLinkStub } },
  })
}

describe('AuditLogList', () => {
  it('mostra quem, o quê, sobre qual recurso e de onde', () => {
    const row = render().findAll('tbody tr')[0]!

    expect(row.text()).toContain('Beatriz Falcão Ribeiro')
    expect(row.text()).toContain('Alteração')
    expect(row.text()).toContain('Texto anterior: “Olá”')
    expect(row.text()).toContain('Área do encarregado')
  })

  it('leva à requisição pelo protocolo', () => {
    const link = render().findAllComponents(RouterLinkStub)[0]!

    expect(link.props('to')).toEqual({ name: 'request-detail', params: { id: 'abc' } })
    expect(link.text()).toBe('2026-000418')
  })

  it('destaca o acesso negado', () => {
    expect(render().findAll('tbody tr')[1]!.classes()).toContain('bg-danger-wash')
  })

  it('não oferece nenhuma ação sobre os registros', () => {
    expect(render().findAll('button')).toHaveLength(0)
  })
})
