import type { DataSubjectRight } from '@/shared/types/lgpd'

/**
 * Os nove direitos do art. 18 da LGPD, na ordem dos incisos.
 *
 * Fica em `shared` porque a tela "Nova Requisição" reaproveita exatamente
 * esta lista para montar a escolha do direito a ser exercido.
 */
export const LGPD_RIGHTS: readonly DataSubjectRight[] = [
  {
    numeral: 'I',
    title: 'Confirmação de tratamento',
    description: 'Saber se a organização trata algum dado pessoal seu.',
    requestLabel: 'Confirmação de tratamento',
    requestSummary:
      'Saber se a organização trata dados seus, sem receber ainda o conteúdo.',
  },
  {
    numeral: 'II',
    title: 'Acesso aos dados',
    description: 'Receber uma cópia dos dados que temos sobre você.',
    requestLabel: 'Acesso aos dados',
    requestSummary:
      'Receber cópia dos dados pessoais que a organização mantém sobre você.',
  },
  {
    numeral: 'III',
    title: 'Correção',
    description: 'Corrigir dados errados, incompletos ou desatualizados.',
    requestLabel: 'Correção de dados',
    requestSummary:
      'Corrigir dados incompletos, inexatos ou desatualizados.',
  },
  {
    numeral: 'IV',
    title: 'Anonimização, bloqueio ou eliminação',
    description:
      'Pedir a remoção ou o bloqueio de dados desnecessários, excessivos ou tratados fora da lei.',
    requestLabel: 'Anonimização, bloqueio ou eliminação',
    requestSummary:
      'Para dados desnecessários, excessivos ou tratados fora da lei.',
  },
  {
    numeral: 'V',
    title: 'Portabilidade',
    description: 'Pedir que seus dados sejam enviados a outro fornecedor de serviço.',
    requestLabel: 'Portabilidade dos dados',
    requestSummary:
      'Levar seus dados a outro prestador de serviço ou produto.',
  },
  {
    numeral: 'VI',
    title: 'Eliminação dos dados',
    description: 'Pedir a exclusão dos dados que tratamos porque você autorizou.',
    requestLabel: 'Eliminação de dados',
    requestSummary:
      'Apagar dados que você autorizou, respeitadas as guardas legais.',
  },
  {
    numeral: 'VII',
    title: 'Com quem compartilhamos',
    description: 'Saber quais empresas e órgãos públicos receberam dados seus.',
    requestLabel: 'Informação sobre compartilhamento',
    requestSummary:
      'Com quais entidades públicas e privadas seus dados foram compartilhados.',
  },
  {
    numeral: 'VIII',
    title: 'O que acontece se você não autorizar',
    description: 'Saber que pode recusar o consentimento e quais são as consequências.',
    requestLabel: 'Informação sobre a recusa de consentimento',
    requestSummary:
      'O que acontece se você não consentir e quais são as consequências.',
  },
  {
    numeral: 'IX',
    title: 'Revogação do consentimento',
    description: 'Voltar atrás em uma autorização que você já deu.',
    requestLabel: 'Revogação do consentimento',
    requestSummary:
      'Retirar uma autorização dada antes, a partir de agora.',
  },
]

/** Referência legal exibida quando o tenant opta por mostrá-la. */
export const LGPD_RIGHTS_LEGAL_REFERENCE = 'art. 18 da LGPD'

/** Referência do inciso, como o design a exibe numa requisição: "art. 18, VI". */
export function legalReferenceFor(numeral: string): string {
  return `art. 18, ${numeral}`
}

export function findRight(numeral: string): DataSubjectRight | undefined {
  return LGPD_RIGHTS.find((right) => right.numeral === numeral)
}
