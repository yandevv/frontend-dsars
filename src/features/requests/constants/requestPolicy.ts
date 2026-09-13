/**
 * Regras numéricas do atendimento, reunidas porque aparecem em mais de uma
 * tela: o formulário do titular, a fila da encarregada e o relatório citam
 * exatamente os mesmos números, e vê-los juntos evita que um deles mude sozinho.
 */

/**
 * Art. 19 da LGPD: até 15 dias corridos contados do registro para a declaração
 * completa. É também o prazo que a organização aplica aos demais direitos.
 */
export const LEGAL_DEADLINE_DAYS = 15

/**
 * Resposta imediata: confirmação de tratamento e acesso em formato simplificado
 * (RN019). A lei não diz em horas o que é "imediato"; a organização adota 24
 * horas a partir do registro, iguais para um pedido das 9h e um das 23h50.
 */
export const IMMEDIATE_DEADLINE_HOURS = 24

/** A partir de quantos dias restantes a fila passa a chamar atenção. */
export const DEADLINE_ALERT_DAYS = 3

export const DESCRIPTION_MIN_LENGTH = 20
export const DESCRIPTION_MAX_LENGTH = 2000

/** O motivo do cancelamento: uma frase basta, mas uma palavra solta não explica nada. */
export const CANCEL_REASON_MIN_LENGTH = 10
export const CANCEL_REASON_MAX_LENGTH = 500

/** Mensagens da requisição: texto até 2.000 caracteres, ou só anexo. */
export const MESSAGE_MAX_LENGTH = 2000

/** Depois deste tempo a mensagem não pode mais ser editada — só excluída. */
export const MESSAGE_EDIT_WINDOW_MINUTES = 30

export const ANSWER_MIN_LENGTH = 40
export const ANSWER_MAX_LENGTH = 4000

export const ATTACHMENT_MAX_COUNT = 5
export const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024
export const ATTACHMENT_ACCEPT = '.pdf,.jpg,.jpeg,.png'
export const ATTACHMENT_RULE = 'PDF, JPG ou PNG · até 10 MB cada · no máximo 5 arquivos'

/** Anexos da resposta seguem outra regra: relatórios e exportações são maiores. */
export const ANSWER_ATTACHMENT_ACCEPT = '.pdf,.csv,.zip'
export const ANSWER_ATTACHMENT_MAX_BYTES = 20 * 1024 * 1024
export const ANSWER_ATTACHMENT_RULE =
  'Relatórios, comprovantes de eliminação ou arquivos de portabilidade. PDF, CSV ou ZIP de até 20 MB.'

/** Fundamentos que a organização aceita para recusar um pedido. */
export const REFUSAL_GROUNDS: readonly string[] = [
  'Guarda obrigatória por norma sanitária (prontuário)',
  'Obrigação legal ou regulatória do controlador',
  'Exercício regular de direito em processo',
  'Dados anonimizados, fora do escopo da LGPD',
]
