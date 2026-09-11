/**
 * O cadastro de titulares do Instituto Meridiano que a busca da encarregada
 * percorre ao registrar um pedido recebido por outro canal.
 *
 * Quem tem conta no portal usa o mesmo e-mail de `features/auth/data/accounts.ts`
 * e das requisições de demonstração, para que o registro apareça na lista
 * certa. Documentos e telefones são fictícios.
 */
export interface RegisteredSubject {
  id: string
  name: string
  cpf: string
  /** Vazio quando o cadastro não tem e-mail. */
  email: string
  phone?: string
  hasAccount: boolean
  /** A última relação com a organização — "atendimento em 2021". */
  since: string
}

export const SUBJECT_REGISTRY: readonly RegisteredSubject[] = [
  {
    id: 'marina',
    name: 'Marina Torres de Almeida',
    cpf: '476.201.789-04',
    email: 'titular@exemplo.com.br',
    phone: '(16) 99482-3071',
    hasAccount: true,
    since: 'cadastro desde 2019',
  },
  {
    id: 'marcos',
    name: 'Marcos Teodoro Lima',
    cpf: '381.207.554-08',
    email: 'marcos.teodoro@exemplo.com.br',
    hasAccount: true,
    since: 'cadastro desde 2022',
  },
  {
    id: 'rafael',
    name: 'Rafael Nogueira Lima',
    cpf: '205.918.334-51',
    email: 'pendente@exemplo.com.br',
    phone: '(16) 98110-2267',
    hasAccount: true,
    since: 'conta com e-mail ainda não confirmado',
  },
  {
    id: 'joana',
    name: 'Joana Prado Vasconcelos',
    cpf: '927.114.630-17',
    email: '',
    phone: '(16) 3722-1180',
    hasAccount: false,
    since: 'atendimento em 2021',
  },
  {
    id: 'iara',
    name: 'Iara Bonfim Castro',
    cpf: '604.532.118-21',
    email: 'iara.castro@exemplo.com.br',
    hasAccount: true,
    since: 'cadastro desde 2024',
  },
]
