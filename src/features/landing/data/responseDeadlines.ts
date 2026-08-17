import type { ResponseDeadline } from '@/features/landing/types/landing'

/** Prazos do art. 19 da LGPD, na redação usada no design. */
export const RESPONSE_DEADLINES: readonly ResponseDeadline[] = [
  {
    label: 'Resposta imediata',
    description:
      'Para confirmar se tratamos algum dado seu e para ver esses dados em formato simplificado.',
  },
  {
    label: 'Até 15 dias',
    description:
      'Para a declaração completa: quais dados temos, de onde vieram, para que servem e com quem foram compartilhados.',
  },
]
