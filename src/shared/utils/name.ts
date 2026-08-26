/**
 * Nome reduzido à inicial e ao primeiro sobrenome — "Beatriz Falcão Ribeiro"
 * vira "B. Falcão".
 *
 * Existe para a coluna de responsável da fila, estreita por opção do design:
 * quem trabalha ali conhece a equipe pelo sobrenome, e o nome inteiro empurraria
 * o prazo para fora da tela.
 */
export function abbreviateName(name: string): string {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]
  const surname = parts[1]
  if (!first) return name
  if (!surname) return first
  return `${first.charAt(0)}. ${surname}`
}
