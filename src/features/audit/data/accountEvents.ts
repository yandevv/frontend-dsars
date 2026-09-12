import { daysFromNow } from '@/shared/utils/date'
import type { AuditEntry } from '@/features/audit/types/audit'

/**
 * Eventos de conta e de área restrita que o servidor já teria gravado antes de
 * a demonstração começar. Os das requisições vêm do histórico delas; estes
 * são os que não pertencem a requisição nenhuma.
 */

/** Hoje, no horário dado, sem cair no futuro quando a demonstração abre cedo. */
function at(days: number, time: string): string {
  const [hours, minutes] = time.split(':').map(Number)
  const date = new Date(daysFromNow(days))
  date.setHours(hours!, minutes!, 0, 0)
  const now = new Date()
  return (date > now ? now : date).toISOString()
}

const HELENA = 'Helena Prado Vasconcelos'
const MARINA = 'Marina Torres de Almeida'

export function seedAccountEvents(): AuditEntry[] {
  return [
    {
      id: 'aud-seed-01',
      at: at(0, '08:52'),
      actor: HELENA,
      actorRole: 'encarregado',
      operation: 'seguranca',
      action: 'Sessão iniciada',
      detail: 'Entrada com e-mail e senha na área do encarregado.',
      resource: { kind: 'conta', label: `Conta de ${HELENA}` },
      origin: 'Área do encarregado · Ribeirão Preto, SP',
    },
    {
      id: 'aud-seed-02',
      at: at(-1, '21:14'),
      actor: MARINA,
      actorRole: 'titular',
      operation: 'negado',
      action: 'Tentativa de acesso à área do encarregado',
      detail: 'Conta de titular tentou abrir a fila de atendimento. O acesso foi recusado.',
      resource: { kind: 'area-restrita', label: 'Fila de atendimento' },
      origin: 'Portal do titular · São Paulo, SP',
    },
    {
      id: 'aud-seed-03',
      at: at(-2, '10:05'),
      actor: MARINA,
      actorRole: 'titular',
      operation: 'acesso',
      action: 'Documento exibido sem máscara',
      detail: 'O CPF ficou visível por 30 segundos na tela de dados pessoais.',
      resource: { kind: 'conta', label: `Conta de ${MARINA}` },
      origin: 'Portal do titular · São Paulo, SP',
    },
    {
      id: 'aud-seed-04',
      at: at(-3, '16:40'),
      actor: HELENA,
      actorRole: 'encarregado',
      operation: 'exportacao',
      action: 'Relatório gerencial exportado',
      detail: 'Indicadores em CSV · últimos 90 dias · todos os direitos · todos os estados.',
      resource: { kind: 'relatorio', label: 'Relatório gerencial' },
      origin: 'Área do encarregado · Ribeirão Preto, SP',
    },
    {
      id: 'aud-seed-05',
      at: at(-12, '19:22'),
      actor: MARINA,
      actorRole: 'titular',
      operation: 'seguranca',
      action: 'Senha alterada',
      detail: 'Troca feita nas configurações da conta. Duas outras sessões foram encerradas.',
      resource: { kind: 'conta', label: `Conta de ${MARINA}` },
      origin: 'Portal do titular · São Paulo, SP',
    },
  ]
}
