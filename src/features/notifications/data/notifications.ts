import { DEMO_REQUESTS } from '@/features/requests/data/requests'
import { daysFromNow } from '@/shared/utils/date'
import type { AppNotification } from '@/features/notifications/types/notification'

/**
 * Avisos de demonstração, transcritos de `Notificacoes.dc.html` e ligados às
 * requisições de `features/requests/data/requests.ts`.
 *
 * Duas mudanças em relação ao mockup. Os destinos apontam para requisições que
 * existem de verdade na demonstração, para que acionar um aviso leve a algum
 * lugar. E sai o aviso "Pesquisa de satisfação respondida · nota 4 na
 * 2026-000392": ele ligaria a nota ao protocolo, e a pesquisa só chega à
 * equipe de forma agregada.
 *
 * As datas são relativas a hoje, como as da fila. Tudo some junto com o
 * serviço falso.
 */

/**
 * Momento a `days` dias de hoje, no horário informado.
 *
 * Um aviso "de hoje, 08:14" aberto às seis da manhã estaria no futuro; nesse
 * caso ele recua para um minuto antes de agora, e continua sendo de hoje.
 */
function moment(days: number, time: string): string {
  const date = new Date(daysFromNow(days))
  const [hours = '9', minutes = '0'] = time.split(':')
  date.setHours(Number(hours), Number(minutes), 0, 0)
  const latest = Date.now() - 60_000
  return new Date(Math.min(date.getTime(), latest)).toISOString()
}

function idOf(protocol: string): string {
  const request = DEMO_REQUESTS.find((item) => item.protocol === protocol)
  if (!request) throw new Error(`Requisição de demonstração ${protocol} não existe.`)
  return request.id
}

const mine = (protocol: string) => ({ name: 'my-request-detail', params: { id: idOf(protocol) } })
const queue = (protocol: string) => ({ name: 'request-detail', params: { id: idOf(protocol) } })

/** A caixa de avisos do titular de demonstração, a mesma conta de `accounts.ts`. */
export const DEMO_TITULAR_NOTIFICATIONS: readonly AppNotification[] = [
  {
    id: 't-prazo-0418',
    type: 'Prazo vencido',
    tone: 'alerta',
    title: 'O prazo de resposta da 2026-000418 venceu',
    detail:
      'A organização ainda não respondeu ao seu pedido de eliminação de dados. A resposta continua devida e o atraso fica registrado.',
    at: moment(0, '08:14'),
    reference: 'Protocolo 2026-000418',
    target: mine('2026-000418'),
    unread: true,
  },
  {
    id: 't-pesquisa-0392',
    type: 'Pesquisa de satisfação',
    tone: 'neutro',
    title: 'Como foi o atendimento da 2026-000392?',
    detail:
      'Uma pergunta de nota e um campo livre. As respostas entram no relatório sem identificar quem respondeu.',
    at: moment(-15, '17:30'),
    reference: 'Protocolo 2026-000392',
    target: { ...mine('2026-000392'), query: { pesquisa: '1' } },
    unread: true,
  },
  {
    id: 't-mensagem-0418',
    type: 'Nova mensagem',
    tone: 'pendencia',
    title: 'A equipe escreveu na requisição 2026-000418',
    detail: 'Há uma pergunta sobre quais mensagens devem deixar de chegar até você.',
    at: moment(-6, '10:12'),
    reference: 'Protocolo 2026-000418',
    target: mine('2026-000418'),
    unread: false,
  },
  {
    id: 't-concluida-0392',
    type: 'Requisição concluída',
    tone: 'neutro',
    title: 'A resposta à 2026-000392 está disponível',
    detail: 'O arquivo de portabilidade pode ser baixado na própria requisição por 30 dias.',
    at: moment(-15, '17:26'),
    reference: 'Protocolo 2026-000392',
    target: mine('2026-000392'),
    unread: false,
  },
  {
    id: 't-registrada-0447',
    type: 'Requisição registrada',
    tone: 'neutro',
    title: 'Protocolo 2026-000447 aberto',
    detail: 'Sua requisição de acesso aos dados entrou na fila de atendimento.',
    at: moment(-6, '10:22'),
    reference: 'Protocolo 2026-000447',
    target: mine('2026-000447'),
    unread: false,
  },
  {
    id: 't-cancelada-0301',
    type: 'Requisição cancelada',
    tone: 'neutro',
    title: 'Cancelamento do 2026-000301 confirmado',
    detail: 'O protocolo foi cancelado a seu pedido, sem resposta de mérito.',
    at: moment(-70, '14:31'),
    reference: 'Protocolo 2026-000301',
    unavailableReason:
      'O prazo de retenção da requisição venceu e os detalhes foram eliminados. A notificação permanece na lista como registro do que aconteceu.',
    unread: false,
  },
]

/** A caixa da equipe de atendimento: quem atende a organização lê os mesmos avisos. */
export const DEMO_TEAM_NOTIFICATIONS: readonly AppNotification[] = [
  {
    id: 'e-prazo',
    type: 'Prazo vencido',
    tone: 'alerta',
    title: '2 requisições passaram do prazo legal de 15 dias',
    detail:
      'Os protocolos 2026-000418 e 2026-000403 estão fora do prazo contado do registro e precisam de resposta imediata.',
    at: moment(0, '07:00'),
    reference: 'Fila de atendimento',
    target: { name: 'request-queue', query: { prazo: 'vencidas' } },
    unread: true,
  },
  {
    id: 'e-vence-0444',
    type: 'Prazo próximo',
    tone: 'pendencia',
    title: 'A 2026-000444 vence em 3 dias',
    detail: 'Revogação do consentimento, ainda em análise.',
    at: moment(0, '07:00'),
    reference: 'Protocolo 2026-000444',
    target: queue('2026-000444'),
    unread: true,
  },
  {
    id: 'e-nova-0452',
    type: 'Nova requisição',
    tone: 'neutro',
    title: 'Requisição de portabilidade registrada por Iara Bonfim Castro',
    detail: 'Entrou na fila ainda sem responsável designado.',
    at: moment(-3, '09:24'),
    reference: 'Protocolo 2026-000452',
    target: queue('2026-000452'),
    unread: true,
  },
  {
    id: 'e-relatorio',
    type: 'Relatório disponível',
    tone: 'neutro',
    title: 'Os números do mês anterior já podem ser exportados',
    detail: 'O relatório gerencial fecha o mês com os indicadores de prazo e de satisfação.',
    at: moment(-24, '08:00'),
    reference: 'Relatório gerencial',
    target: { name: 'management-report' },
    unread: false,
  },
  {
    id: 'e-cancelada-0377',
    type: 'Requisição cancelada',
    tone: 'neutro',
    title: 'O titular cancelou o protocolo 2026-000377',
    detail: 'Cancelado antes da resposta; não entra no cálculo de prazo nem no tempo médio.',
    at: moment(-25, '19:08'),
    reference: 'Protocolo 2026-000377',
    target: queue('2026-000377'),
    unread: false,
  },
  {
    id: 'e-arquivada-0288',
    type: 'Requisição arquivada',
    tone: 'neutro',
    title: 'A 2026-000288 foi arquivada',
    detail: 'Encerrada no semestre anterior e retirada da fila.',
    at: moment(-60, '15:02'),
    reference: 'Protocolo 2026-000288',
    unavailableReason:
      'A requisição foi arquivada e saiu do escopo de acesso desta conta. Peça ao administrador se precisar consultar o histórico completo.',
    unread: false,
  },
]
