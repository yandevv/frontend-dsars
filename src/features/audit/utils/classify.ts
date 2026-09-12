import type { AuditOperation } from '@/features/audit/types/audit'

/**
 * O tipo de operação de uma entrada do histórico da requisição.
 *
 * O histórico foi escrito para ser lido, não classificado; as regras abaixo
 * leem o título da entrada. No servidor a operação é gravada junto do evento, e
 * esta função some.
 */
const RULES: readonly [RegExp, AuditOperation][] = [
  [/^Requisição registrada/, 'criacao'],
  [/cancelada|finalizado|^Complemento (solicitado|enviado)/, 'transicao'],
  [/^Identidade verificada|^Anexos conferidos|^Arquivo .* gerado/, 'acesso'],
]

export function operationOf(title: string): AuditOperation {
  return RULES.find(([pattern]) => pattern.test(title))?.[1] ?? 'alteracao'
}
