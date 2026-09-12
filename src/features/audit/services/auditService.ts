import { delay } from '@/features/auth/services/fakeNetwork'
import { findDemoAccount } from '@/features/auth/data/accounts'
import { listRequests } from '@/features/requests/services/requestService'
import { operationOf } from '@/features/audit/utils/classify'
import { seedAccountEvents } from '@/features/audit/data/accountEvents'
import { uuidv7 } from '@/shared/utils/uuid'
import type { Account } from '@/features/auth/types/auth'
import type { DataRequest } from '@/features/requests/types/request'
import type { AuditEntry, AuditResource, NewAuditEntry } from '@/features/audit/types/audit'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ATENÇÃO — a trilha de verdade é gravada pelo servidor, a cada operação, num
 * armazenamento que ninguém edita. Aqui ela é montada no navegador a partir do
 * histórico das requisições e dos eventos de conta que as telas registram.
 *
 * O módulo não exporta nada que altere ou apague um registro, e isso é
 * deliberado (RN084): a única escrita possível é acrescentar.
 * ─────────────────────────────────────────────────────────────────────────────
 */

let accountEvents: AuditEntry[] = seedAccountEvents()

/** O nome de quem agiu, para a trilha não mostrar só um endereço de e-mail. */
export function actorOf(account: Pick<Account, 'role' | 'email'> & { name?: string }) {
  return {
    actor: account.name || findDemoAccount(account.email)?.name || account.email,
    actorRole: account.role,
  }
}

/** De onde parte cada perfil — o servidor gravaria também o endereço IP. */
export function originOf(role: Account['role']): string {
  return role === 'titular' ? 'Portal do titular' : 'Área do encarregado'
}

/** Acrescenta um registro. Não há contrapartida para editar ou excluir. */
export function recordAudit(entry: NewAuditEntry): AuditEntry {
  const recorded = { ...entry, id: uuidv7(), at: new Date().toISOString() }
  accountEvents = [recorded, ...accountEvents]
  return recorded
}

/**
 * Registra algo que alguém fez com a própria sessão — dados, senha, sessões,
 * preferências, exportações. O recurso é a conta, a menos que se diga outro.
 */
export function recordAccountEvent(
  account: Pick<Account, 'email'> & Partial<Pick<Account, 'role' | 'name'>>,
  event: Pick<AuditEntry, 'operation' | 'action' | 'detail'> & { resource?: AuditResource },
): AuditEntry {
  const known = findDemoAccount(account.email)
  const role = account.role ?? known?.role ?? 'titular'
  const { actor } = actorOf({ ...account, role })
  return recordAudit({
    ...event,
    actor,
    actorRole: role,
    resource: event.resource ?? { kind: 'conta', label: `Conta de ${actor}` },
    origin: originOf(role),
  })
}

/** Volta a trilha de conta ao estado de demonstração. Existe para os testes. */
export function resetAudit(): void {
  accountEvents = seedAccountEvents()
}

/** O histórico de uma requisição, visto como registros da trilha. */
function fromRequest(request: DataRequest): AuditEntry[] {
  return request.timeline.map((entry, index) => {
    const byTitular = entry.author === 'Titular' || entry.author === request.subject.name
    return {
      id: `${request.id}:${request.timeline.length - index}`,
      at: entry.at,
      actor: byTitular ? request.subject.name : entry.author,
      actorRole: byTitular ? 'titular' : 'encarregado',
      operation: operationOf(entry.title),
      action: entry.title,
      detail: entry.detail,
      resource: { kind: 'requisicao', label: request.protocol, requestId: request.id },
      origin: originOf(byTitular ? 'titular' : 'encarregado'),
    }
  })
}

/** A trilha inteira da organização, do mais recente para o mais antigo. */
export async function listAuditEntries(): Promise<AuditEntry[]> {
  const requests = await listRequests()
  await delay(300)
  return [...requests.flatMap(fromRequest), ...accountEvents].sort((a, b) =>
    b.at.localeCompare(a.at),
  )
}
