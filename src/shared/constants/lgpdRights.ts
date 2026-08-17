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
  },
  {
    numeral: 'II',
    title: 'Acesso aos dados',
    description: 'Receber uma cópia dos dados que temos sobre você.',
  },
  {
    numeral: 'III',
    title: 'Correção',
    description: 'Corrigir dados errados, incompletos ou desatualizados.',
  },
  {
    numeral: 'IV',
    title: 'Anonimização, bloqueio ou eliminação',
    description:
      'Pedir a remoção ou o bloqueio de dados desnecessários, excessivos ou tratados fora da lei.',
  },
  {
    numeral: 'V',
    title: 'Portabilidade',
    description: 'Pedir que seus dados sejam enviados a outro fornecedor de serviço.',
  },
  {
    numeral: 'VI',
    title: 'Eliminação dos dados',
    description: 'Pedir a exclusão dos dados que tratamos porque você autorizou.',
  },
  {
    numeral: 'VII',
    title: 'Com quem compartilhamos',
    description: 'Saber quais empresas e órgãos públicos receberam dados seus.',
  },
  {
    numeral: 'VIII',
    title: 'O que acontece se você não autorizar',
    description: 'Saber que pode recusar o consentimento e quais são as consequências.',
  },
  {
    numeral: 'IX',
    title: 'Revogação do consentimento',
    description: 'Voltar atrás em uma autorização que você já deu.',
  },
]

/** Referência legal exibida quando o tenant opta por mostrá-la. */
export const LGPD_RIGHTS_LEGAL_REFERENCE = 'art. 18 da LGPD'
