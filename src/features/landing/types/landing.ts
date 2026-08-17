/** Prazo legal de resposta exibido na página inicial. */
export interface ResponseDeadline {
  label: string
  description: string
}

/** Etapa do fluxo de atendimento de uma requisição. */
export interface RequestFlowStep {
  /** Numeração exibida no design: 01, 02, 03. */
  number: string
  title: string
  description: string
}
