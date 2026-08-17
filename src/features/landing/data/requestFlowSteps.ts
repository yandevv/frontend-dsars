import type { RequestFlowStep } from '@/features/landing/types/landing'

/** As três etapas de "Como o atendimento funciona". */
export const REQUEST_FLOW_STEPS: readonly RequestFlowStep[] = [
  {
    number: '01',
    title: 'Você registra o pedido',
    description:
      'Escolhe o direito a ser exercido, descreve o que precisa e anexa documentos, se for o caso.',
  },
  {
    number: '02',
    title: 'A pessoa encarregada conduz',
    description:
      'Se faltar alguma informação, ela pergunta dentro do próprio pedido. Tudo fica no mesmo lugar.',
  },
  {
    number: '03',
    title: 'Você recebe a resposta',
    description:
      'A resposta final e os arquivos ficam guardados no pedido, com data e protocolo.',
  },
]
