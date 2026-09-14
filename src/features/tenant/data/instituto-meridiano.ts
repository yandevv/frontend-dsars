import type { Tenant } from '@/features/tenant/types/tenant'

/**
 * Identidade do portal: o que a API não guarda — CNPJ, endereço, horário de
 * atendimento, a forma de tratamento — e o valor inicial enquanto o perfil da
 * organização não chega. Nome e contato do encarregado vêm da API e
 * substituem os daqui assim que `GET /public/organizations/:slug` responde.
 *
 * Congelado porque é configuração de leitura: um componente que tentasse
 * alterá-lo estaria cometendo um erro, e é melhor que isso falhe em teste.
 */
export const institutoMeridiano: Readonly<Tenant> = Object.freeze({
  slug: import.meta.env.VITE_ORGANIZATION_SLUG ?? 'demonstracao',
  name: 'Instituto Meridiano de Saúde',
  shortName: 'Instituto Meridiano',
  tagline: 'Atendimento a requisições de titulares de dados',
  registrationId: '12.345.678/0001-90',
  address: 'Av. Brasil, 1420 — Franca/SP, 14401-135',
  dpo: Object.freeze({
    name: 'Helena Prado Vasconcelos',
    role: 'Encarregada de proteção de dados',
    blurb:
      'É a pessoa responsável por receber os seus pedidos e falar com você em nome da organização.',
    email: 'dpo@meridianosaude.org.br',
    phone: '(16) 3711-0480',
    officeHours: 'dias úteis, 9h às 17h',
  }),
})
