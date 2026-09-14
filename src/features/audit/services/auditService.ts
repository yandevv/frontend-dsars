import { listOrganizationRequests } from '@/features/requests/services/requestService'
import { operationOf } from '@/features/audit/utils/classify'
import { uuidv7 } from '@/shared/utils/uuid'
import type { Account } from '@/features/auth/types/auth'
import type { DataRequest } from '@/features/requests/types/request'
import type { AuditEntry, AuditResource, NewAuditEntry } from '@/features/audit/types/audit'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ATENÇÃO — a trilha de verdade é gravada pelo servidor, a cada operação, num
 * armazenamento que ninguém edita. A API ainda não expõe a consulta dessa
 * trilha; até lá, esta tela a aproxima com o que já existe: o registro e o
 * encerramento das requisições da organização, vindos da API, e os eventos da
 * própria sessão registrados nesta aba.
 *
 * O módulo não exporta nada que altere ou apague um registro, e isso é
 * deliberado (RN084): a única escrita possível é acrescentar.
 * ─────────────────────────────────────────────────────────────────────────────
 */

let sessionEvents: AuditEntry[] = []

/** O nome de quem agiu, para a trilha não mostrar só um endereço de e-mail. */
export function actorOf(account: Pick<Account, 'role' | 'email'> & { name?: string }) {
  return { actor: account.name || account.email, actorRole: account.role }
}

/** De onde parte cada perfil — o servidor grava também o endereço IP. */
export function originOf(role: Account['role']): string {
  return role === 'titular' ? 'Portal do titular' : 'Área do encarregado'
}

/** Acrescenta um registro. Não há contrapartida para editar ou excluir. */
export function recordAudit(entry: NewAuditEntry): AuditEntry {
  const recorded = { ...entry, id: uuidv7(), at: new Date().toISOString() }
  sessionEvents = [recorded, ...sessionEvents]
  return recorded
}

/**
 * Registra algo que alguém fez com a própria sessão — exportações, por
 * exemplo. O recurso é a conta, a menos que se diga outro.
 */
export function recordAccountEvent(
  account: Pick<Account, 'email'> & Partial<Pick<Account, 'role' | 'name'>>,
  event: Pick<AuditEntry, 'operation' | 'action' | 'detail'> & { resource?: AuditResource },
): AuditEntry {
  const role = account.role ?? 'titular'
  const { actor } = actorOf({ ...account, role })
  return recordAudit({
    ...event,
    actor,
    actorRole: role,
    resource: event.resource ?? { kind: 'conta', label: `Conta de ${actor}` },
    origin: originOf(role),
  })
}

/** Esvazia os eventos da sessão. Existe para os testes. */
export function resetAudit(): void {
  sessionEvents = []
}

/** O registro e o encerramento de uma requisição, vistos como registros da trilha. */
export function fromRequest(request: DataRequest): AuditEntry[] {
  const resource: AuditResource = {
    kind: 'requisicao',
    label: request.protocol,
    requestId: request.id,
  }
  const subject = request.subject.name || 'Titular'
  const entries: AuditEntry[] = [
    {
      id: `${request.id}:registro`,
      at: request.registeredAt,
      actor: subject,
      actorRole: 'titular',
      operation: operationOf('Requisição registrada'),
      action: 'Requisição registrada',
      detail: `Protocolo ${request.protocol} gerado pela plataforma.`,
      resource,
      origin: originOf('titular'),
    },
  ]

  if (request.closedAt && request.status !== 'aberta') {
    const cancelled = request.status === 'cancelada'
    const action = cancelled ? 'Requisição cancelada pelo titular' : 'Atendimento finalizado'
    entries.push({
      id: `${request.id}:encerramento`,
      at: request.closedAt,
      actor: cancelled ? subject : 'Encarregado',
      actorRole: cancelled ? 'titular' : 'encarregado',
      operation: operationOf(action),
      action,
      detail: cancelled
        ? 'A contagem do prazo foi encerrada.'
        : 'Parecer conclusivo enviado ao titular, com o resultado anexado.',
      resource,
      origin: originOf(cancelled ? 'titular' : 'encarregado'),
    })
  }

  return entries
}

/** A trilha da organização que esta tela alcança, do mais recente para o mais antigo. */
export async function listAuditEntries(): Promise<AuditEntry[]> {
  const requests = await listOrganizationRequests()
  return [...requests.flatMap(fromRequest), ...sessionEvents].sort((a, b) =>
    b.at.localeCompare(a.at),
  )
}
