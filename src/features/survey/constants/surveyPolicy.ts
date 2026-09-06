/**
 * A escala da pesquisa, do jeito que ela aparece nos botões.
 *
 * Os rótulos descrevem o atendimento, não quem responde: "satisfatório" serve
 * a qualquer pessoa, "satisfeita" não.
 */
export const SURVEY_RATINGS: readonly { value: number; label: string }[] = [
  { value: 1, label: 'Muito insatisfatório' },
  { value: 2, label: 'Insatisfatório' },
  { value: 3, label: 'Regular' },
  { value: 4, label: 'Satisfatório' },
  { value: 5, label: 'Muito satisfatório' },
]

export const SURVEY_COMMENT_MAX_LENGTH = 600

export function ratingLabel(value: number): string {
  return SURVEY_RATINGS.find((rating) => rating.value === value)?.label ?? ''
}
