import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'

import { useAuditLog } from '../useAuditLog'
import { recordAccountEvent, resetAudit } from '@/features/audit/services/auditService'

vi.mock('@/features/requests/services/requestService', async () => {
  const { titularRequests } = await import('@/test/factories')
  return { listOrganizationRequests: () => Promise.resolve(titularRequests()) }
})

const route: { query: Record<string, string> } = { query: {} }
const replace = vi.fn<(to: unknown) => Promise<void>>(() => Promise.resolve())
vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-router')>()),
  useRoute: () => route,
  useRouter: () => ({ replace }),
}))

async function load(query: Record<string, string> = {}) {
  route.query = query
  const audit = useAuditLog()
  await flushPromises()
  return audit
}

describe('useAuditLog', () => {
  beforeEach(() => {
    resetAudit()
    replace.mockClear()
    recordAccountEvent(
      { email: 'marina@exemplo.com.br', name: 'Marina Torres de Almeida', role: 'titular' },
      {
        operation: 'negado',
        action: 'Tentativa de acesso à área do encarregado',
        detail: 'Recusada pelo servidor.',
        resource: { kind: 'area-restrita', label: 'Área do encarregado' },
      },
    )
  })

  it('filtra por tipo de operação e leva o recorte para a URL', async () => {
    const audit = await load()

    audit.operation.value = 'negado'
    await flushPromises()

    expect(audit.filtered.value).toHaveLength(1)
    expect(audit.filtered.value[0]!.action).toBe('Tentativa de acesso à área do encarregado')
    expect(replace).toHaveBeenLastCalledWith({ query: { operacao: 'negado' } })
  })

  it('abre já recortada quando a URL traz o filtro', async () => {
    const audit = await load({ pessoa: 'Marina Torres de Almeida', periodo: 'todos' })

    expect(audit.filtered.value.length).toBeGreaterThan(0)
    expect(audit.filtered.value.every((entry) => entry.actor === 'Marina Torres de Almeida')).toBe(
      true,
    )
  })

  it('busca pelo protocolo', async () => {
    const audit = await load({ periodo: 'todos' })

    audit.search.value = '2026-000392'
    expect(audit.filtered.value.length).toBeGreaterThan(0)
    expect(audit.filtered.value.every((entry) => entry.resource.label === '2026-000392')).toBe(true)
  })

  it('corta pelo período', async () => {
    const audit = await load({ periodo: 'todos' })
    const all = audit.filtered.value.length

    audit.period.value = 'hoje'
    expect(audit.filtered.value.length).toBeLessThan(all)
  })

  it('registra a própria exportação na trilha, com o recorte usado', async () => {
    const audit = await load()
    audit.operation.value = 'negado'

    const csv = await audit.exportCsv({ actor: 'Helena Prado Vasconcelos' })

    expect(csv.split('\r\n')).toHaveLength(2)
    const exported = audit.entries.value[0]!
    expect(exported.action).toBe('Trilha de auditoria exportada')
    expect(exported.detail).toContain('1 registros em CSV')
    expect(exported.detail).toContain('acesso negado')
  })
})
