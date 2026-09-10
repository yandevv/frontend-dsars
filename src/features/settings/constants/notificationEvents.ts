import type { AccountRole } from '@/features/auth/types/auth'
import type {
  NotificationChannel,
  NotificationEventId,
  NotificationPreferences,
} from '@/features/settings/types/preferences'

export const NOTIFICATION_CHANNELS: readonly {
  id: NotificationChannel
  label: string
  note: string
}[] = [
  { id: 'email', label: 'E-mail', note: 'Sempre entregue' },
  { id: 'portal', label: 'No portal', note: 'Sino e listagem' },
  { id: 'sms', label: 'SMS', note: 'Exige telefone' },
]

interface NotificationEvent {
  id: NotificationEventId
  label: string
  description: Record<AccountRole, string>
  /** Quem recebe esse tipo de aviso. */
  roles: readonly AccountRole[]
  /**
   * Canais que não podem ser desligados. Transição de estado e segurança da
   * conta são comunicações obrigatórias: o e-mail delas sempre sai.
   */
  locked: readonly NotificationChannel[]
}

export const NOTIFICATION_EVENTS: readonly NotificationEvent[] = [
  {
    id: 'transicao',
    label: 'Transição de estado da requisição',
    description: {
      titular: 'Registro, análise, conclusão e cancelamento.',
      encarregado: 'Registro de requisição nova e cancelamento pelo titular.',
    },
    roles: ['titular', 'encarregado'],
    locked: ['email'],
  },
  {
    id: 'seguranca',
    label: 'Segurança da conta',
    description: {
      titular: 'Troca de senha, novo acesso e sessões encerradas.',
      encarregado: 'Troca de senha, novo acesso e sessões encerradas.',
    },
    roles: ['titular', 'encarregado'],
    locked: ['email'],
  },
  {
    id: 'prazo',
    label: 'Prazo próximo do vencimento',
    description: {
      titular: 'Aviso três dias antes do prazo legal de resposta.',
      encarregado: 'Aviso três dias antes do vencimento de cada requisição da fila.',
    },
    roles: ['titular', 'encarregado'],
    locked: [],
  },
  {
    id: 'complemento',
    label: 'Pedido de complemento',
    description: {
      titular: 'Quando falta documento ou informação para seguir.',
      encarregado: 'Quando o titular responde a um pedido de complemento.',
    },
    roles: ['titular', 'encarregado'],
    locked: [],
  },
  {
    id: 'mensagem',
    label: 'Nova mensagem na requisição',
    description: {
      titular: 'Quando a equipe escreve na conversa de uma requisição sua.',
      encarregado: 'Quando o titular escreve na conversa de uma requisição.',
    },
    roles: ['titular', 'encarregado'],
    locked: [],
  },
  {
    id: 'pesquisa',
    label: 'Pesquisa de satisfação',
    description: {
      titular: 'Convite enviado depois do encerramento do atendimento.',
      encarregado: 'Convite enviado depois do encerramento do atendimento.',
    },
    roles: ['titular'],
    locked: [],
  },
  {
    id: 'relatorio',
    label: 'Relatório mensal disponível',
    description: {
      titular: '',
      encarregado: 'Fechamento dos números do mês anterior.',
    },
    roles: ['encarregado'],
    locked: [],
  },
]

export function eventsFor(role: AccountRole) {
  return NOTIFICATION_EVENTS.filter((event) => event.roles.includes(role))
}

/** O padrão do portal: tudo no portal, o que pede ação também por e-mail. */
export function defaultPreferences(): NotificationPreferences {
  return {
    transicao: { email: true, portal: true, sms: false },
    seguranca: { email: true, portal: true, sms: true },
    prazo: { email: true, portal: true, sms: false },
    complemento: { email: true, portal: true, sms: true },
    mensagem: { email: true, portal: true, sms: false },
    pesquisa: { email: false, portal: true, sms: false },
    relatorio: { email: true, portal: false, sms: false },
  }
}
