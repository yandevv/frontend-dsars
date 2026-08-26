/**
 * Direito do titular previsto no art. 18 da Lei Geral de Proteção de Dados
 * (Lei nº 13.709/2018).
 *
 * Cada direito aparece em dois registros de linguagem, e os dois vêm do
 * design: o par `title`/`description` é como o portal público explica o
 * direito a quem talvez nunca tenha lido a lei, e o par
 * `requestLabel`/`requestSummary` é como ele aparece dentro de uma
 * requisição — no formulário, na fila e no relatório —, onde o nome precisa
 * ser o mesmo que a encarregada usará na resposta.
 */
export interface DataSubjectRight {
  /** Numeral romano do inciso, como aparece na lei: I a IX. */
  numeral: string
  title: string
  description: string
  requestLabel: string
  requestSummary: string
}
