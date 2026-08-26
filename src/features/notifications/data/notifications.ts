import type { AccountRole } from '@/features/auth/types/auth'
import type { AppNotification } from '@/features/notifications/types/notification'

/**
 * Avisos de demonstração, transcritos dos quadros 1a de
 * `Nova Requisicao.dc.html` e `Fila de Atendimento.dc.html`.
 *
 * Cada perfil vê o seu: o titular acompanha os próprios pedidos, a encarregada
 * acompanha o prazo legal da organização inteira. Somem junto com o serviço
 * falso, como as contas de `features/auth/data/accounts.ts`.
 */
const DEMO_NOTIFICATIONS: Record<AccountRole, readonly AppNotification[]> = {
  titular: [
    {
      id: 'prazo-vencido',
      title: 'Prazo vencido: 2026-000418',
      detail: 'A requisição de eliminação de dados passou do prazo legal de resposta.',
      when: 'Hoje, 08:14',
      unread: true,
    },
    {
      id: 'complemento',
      title: 'Informação complementar solicitada',
      detail: 'A encarregada pediu um documento para seguir com a 2026-000431.',
      when: 'Ontem, 17:02',
      unread: true,
    },
    {
      id: 'respondida',
      title: 'Requisição respondida: 2026-000392',
      detail: 'O arquivo de portabilidade está disponível para download por 30 dias.',
      when: '02/09/2026',
      unread: false,
    },
  ],
  encarregado: [
    {
      id: 'fora-do-prazo',
      title: '2 requisições fora do prazo legal',
      detail: '2026-000418 e 2026-000403 passaram dos 15 dias contados do registro.',
      when: 'Hoje, 07:00',
      unread: true,
    },
    {
      id: 'nova-na-fila',
      title: 'Nova requisição na fila',
      detail: 'Portabilidade dos dados registrada por Iara Bonfim Castro.',
      when: 'Hoje, 09:24',
      unread: true,
    },
    {
      id: 'satisfacao',
      title: 'Pesquisa de satisfação respondida',
      detail: 'Nota 4 de 5 na 2026-000392, com comentário do titular.',
      when: 'Ontem, 18:40',
      unread: false,
    },
  ],
}

export function demoNotificationsFor(role: AccountRole): readonly AppNotification[] {
  return DEMO_NOTIFICATIONS[role]
}
