/**
 * Direito do titular previsto no art. 18 da Lei Geral de Proteção de Dados
 * (Lei nº 13.709/2018).
 */
export interface DataSubjectRight {
  /** Numeral romano do inciso, como aparece na lei: I a IX. */
  numeral: string
  title: string
  description: string
}
