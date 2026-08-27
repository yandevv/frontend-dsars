import { ANALYSTS, DPO_NAME } from '@/features/requests/data/team'
import { LEGAL_DEADLINE_DAYS } from '@/features/requests/constants/requestPolicy'
import { daysFromNow, formatDate } from '@/shared/utils/date'
import type { DataRequest } from '@/features/requests/types/request'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Requisições de demonstração — a fila do quadro 1a de
 * `Fila de Atendimento.dc.html`, com o histórico de `Detalhe da Requisicao
 * Encarregado.dc.html`.
 *
 * Duas escolhas que valem registro:
 *
 * As datas são **relativas a hoje**, não as do mockup. Uma fila com datas
 * gravadas no código venceria inteira com o tempo, e a tela existe justamente
 * para mostrar a diferença entre uma requisição vencida, uma que vence em
 * poucos dias e uma em dia. Aqui essa diferença se mantém em qualquer dia do
 * ano — o que muda é só a data que aparece na tela.
 *
 * Os nomes divergem do mockup onde ele se contradizia. Helena Prado Vasconcelos
 * é a encarregada do portal público, então não pode ser também a titular que
 * abre pedidos contra a própria organização: no lugar dela entra Marina Torres
 * de Almeida, a conta de titular de `features/auth/data/accounts.ts`. As
 * unidades também mudaram de cidade — o Instituto Meridiano fica em Franca/SP,
 * e o mockup as situava em Belo Horizonte.
 *
 * Tudo aqui some junto com o serviço falso de `services/requestService.ts`.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const [BEATRIZ, CAIO] = ANALYSTS

/** Momento a `days` dias de hoje, no horário informado. */
function moment(days: number, time: string): string {
  const date = new Date(daysFromNow(days))
  const [hours = '9', minutes = '0'] = time.split(':')
  date.setHours(Number(hours), Number(minutes), 0, 0)
  return date.toISOString()
}

/** O registro fica sempre 15 dias antes do vencimento, como manda o art. 19. */
function registeredFor(dueInDays: number, time: string): string {
  return moment(dueInDays - LEGAL_DEADLINE_DAYS, time)
}

const MARINA = {
  name: 'Marina Torres de Almeida',
  email: 'titular@exemplo.com.br',
  document: 'CPF ***.418.###-42',
  customerSince: '2019',
  verifiedAt: moment(-16, '10:05'),
}

export const DEMO_REQUESTS: readonly DataRequest[] = [
  {
    protocol: '2026-000418',
    id: 'req_9f3c41a8-2026-0418',
    rightNumeral: 'VI',
    description:
      'Solicito a eliminação dos meus dados de contato usados em campanhas de comunicação da rede, mantendo apenas o que a legislação de saúde obriga a conservar. Não sou mais paciente da unidade Centro desde março de 2024.',
    status: 'em-analise',
    subject: MARINA,
    registeredAt: registeredFor(-2, '09:41'),
    dueAt: moment(-2, '23:59'),
    assignee: BEATRIZ,
    channel: 'Portal do titular, com conta verificada',
    unit: 'Unidade Centro · Franca/SP',
    attachments: [
      { name: 'documento-identidade.pdf', meta: `PDF · 480 KB · enviado em ${formatDate(moment(-17, '09:48'))}` },
      { name: 'comprovante-endereco.pdf', meta: `PDF · 310 KB · enviado em ${formatDate(moment(-17, '09:48'))}` },
    ],
    timeline: [
      {
        at: moment(-7, '15:20'),
        title: 'Nota interna registrada',
        detail:
          'Comunicação confirmou em quais bases o contato ainda aparece e liberou a exclusão. O prontuário permanece por exigência do Conselho Federal de Medicina.',
        author: BEATRIZ,
      },
      {
        at: moment(-9, '11:12'),
        title: 'Consulta enviada à área de comunicação',
        detail:
          'Pedido de levantamento das listas de campanha que ainda guardam telefone e e-mail promocional do titular.',
        author: BEATRIZ,
      },
      {
        at: moment(-12, '09:05'),
        title: 'Anexos conferidos',
        detail:
          'Documento de identidade e comprovante de endereço legíveis, dentro da validade e coerentes com o cadastro.',
        author: BEATRIZ,
      },
      {
        at: moment(-14, '16:40'),
        title: 'Requisição atribuída',
        detail: `Distribuída pela fila de atendimento a ${BEATRIZ}, com 12 dias de prazo restantes.`,
        author: DPO_NAME,
      },
      {
        at: moment(-16, '10:05'),
        title: 'Identidade verificada',
        detail: 'E-mail confirmado e documento conferido. Requisição liberada para análise.',
        author: BEATRIZ,
      },
      {
        at: moment(-17, '09:48'),
        title: 'Anexos recebidos',
        detail: 'Dois arquivos enviados pelo titular junto do pedido.',
        author: 'Titular',
      },
      {
        at: moment(-17, '09:41'),
        title: 'Requisição registrada',
        detail: `Protocolo 2026-000418 gerado pelo portal do titular. Prazo legal: ${formatDate(moment(-2, '23:59'))}.`,
        author: 'Titular',
      },
    ],
    notes: [
      {
        text: 'Base de marketing confirmada com a equipe de comunicação: contato pode ser eliminado. Prontuário permanece por exigência do CFM.',
        author: BEATRIZ,
        at: moment(-7, '15:20'),
      },
      {
        text: 'Atraso causado pela espera da resposta da comunicação. Registrar a causa no relatório trimestral à diretoria.',
        author: BEATRIZ,
        at: moment(-1, '08:30'),
      },
    ],
  },
  {
    protocol: '2026-000403',
    id: 'req_4b71c052-2026-0403',
    rightNumeral: 'II',
    description:
      'Quero a cópia dos exames laboratoriais realizados na unidade Centro entre janeiro e junho de 2026, incluindo os laudos e a identificação de quem os solicitou.',
    status: 'em-analise',
    subject: {
      name: 'Marcos Teodoro Lima',
      email: 'marcos.teodoro@exemplo.com.br',
      document: 'CPF ***.207.###-08',
      customerSince: '2021',
      verifiedAt: moment(-15, '14:22'),
    },
    registeredAt: registeredFor(-1, '18:12'),
    dueAt: moment(-1, '23:59'),
    channel: 'Portal do titular, com conta verificada',
    unit: 'Unidade Centro · Franca/SP',
    attachments: [],
    timeline: [
      {
        at: moment(-15, '14:22'),
        title: 'Identidade verificada',
        detail: 'E-mail confirmado. Requisição liberada para análise.',
        author: DPO_NAME,
      },
      {
        at: moment(-16, '18:12'),
        title: 'Requisição registrada',
        detail: `Protocolo 2026-000403 gerado pelo portal do titular. Prazo legal: ${formatDate(moment(-1, '23:59'))}.`,
        author: 'Titular',
      },
    ],
    notes: [
      {
        text: 'Sem responsável designado. Assumir hoje: o prazo já venceu.',
        author: DPO_NAME,
        at: moment(0, '07:10'),
      },
    ],
  },
  {
    protocol: '2026-000431',
    id: 'req_c18de3f7-2026-0431',
    rightNumeral: 'III',
    description:
      'Meu nome está grafado errado no cadastro e sai errado em todo resultado de exame: consta “Rodrigo Amaral Nevez”. Peço a correção em todos os registros da rede.',
    status: 'aguardando-complemento',
    subject: {
      name: 'Rodrigo Amaral Neves',
      email: 'rodrigo.neves@exemplo.com.br',
      document: 'CPF ***.663.###-17',
      customerSince: '2023',
      verifiedAt: moment(-11, '09:30'),
    },
    registeredAt: registeredFor(2, '11:04'),
    dueAt: moment(2, '23:59'),
    assignee: BEATRIZ,
    channel: 'Portal do titular, com conta verificada',
    unit: 'Unidade Vila Aparecida · Franca/SP',
    attachments: [],
    timeline: [
      {
        at: moment(-4, '09:30'),
        title: 'Complemento solicitado ao titular',
        detail:
          'Pedimos uma foto do documento de identidade para confirmar a grafia correta. Enviado pelo portal e por e-mail; o prazo legal continua correndo.',
        author: BEATRIZ,
        highlight: true,
      },
      {
        at: moment(-11, '09:30'),
        title: 'Identidade verificada',
        detail: 'E-mail confirmado. Requisição liberada para análise.',
        author: BEATRIZ,
      },
      {
        at: moment(-13, '11:04'),
        title: 'Requisição registrada',
        detail: `Protocolo 2026-000431 gerado pelo portal do titular. Prazo legal: ${formatDate(moment(2, '23:59'))}.`,
        author: 'Titular',
      },
    ],
    notes: [],
  },
  {
    protocol: '2026-000444',
    id: 'req_7a2f9be4-2026-0444',
    rightNumeral: 'IX',
    description:
      'Retiro a autorização que dei para receber mensagens sobre campanhas de vacinação e pesquisas de satisfação por WhatsApp e SMS.',
    status: 'em-analise',
    subject: {
      name: 'Sueli Andrade Rocha',
      email: 'sueli.rocha@exemplo.com.br',
      document: 'CPF ***.991.###-60',
      customerSince: '2017',
      verifiedAt: moment(-10, '08:15'),
    },
    registeredAt: registeredFor(3, '16:37'),
    dueAt: moment(3, '23:59'),
    assignee: CAIO,
    channel: 'Portal do titular, com conta verificada',
    unit: 'Unidade Centro · Franca/SP',
    attachments: [],
    timeline: [
      {
        at: moment(-10, '08:15'),
        title: 'Identidade verificada',
        detail: 'E-mail confirmado. Requisição liberada para análise.',
        author: CAIO,
      },
      {
        at: moment(-12, '16:37'),
        title: 'Requisição registrada',
        detail: `Protocolo 2026-000444 gerado pelo portal do titular. Prazo legal: ${formatDate(moment(3, '23:59'))}.`,
        author: 'Titular',
      },
    ],
    notes: [],
  },
  {
    protocol: '2026-000447',
    id: 'req_31c0847d-2026-0447',
    rightNumeral: 'II',
    description:
      'Peço a declaração completa dos dados que a rede mantém sobre mim: quais são, de onde vieram, para que servem e com quem foram compartilhados.',
    status: 'em-analise',
    subject: {
      name: 'Tarso Menezes Braga',
      email: 'tarso.braga@exemplo.com.br',
      document: 'CPF ***.145.###-93',
      customerSince: '2024',
      verifiedAt: moment(-5, '13:48'),
    },
    registeredAt: registeredFor(9, '10:22'),
    dueAt: moment(9, '23:59'),
    channel: 'Portal do titular, com conta verificada',
    attachments: [],
    timeline: [
      {
        at: moment(-5, '13:48'),
        title: 'Identidade verificada',
        detail: 'E-mail confirmado. Requisição liberada para análise.',
        author: DPO_NAME,
      },
      {
        at: moment(-6, '10:22'),
        title: 'Requisição registrada',
        detail: `Protocolo 2026-000447 gerado pelo portal do titular. Prazo legal: ${formatDate(moment(9, '23:59'))}.`,
        author: 'Titular',
      },
    ],
    notes: [],
  },
  {
    protocol: '2026-000452',
    id: 'req_a5e6b209-2026-0452',
    rightNumeral: 'V',
    description:
      'Estou mudando de operadora de saúde e preciso levar o histórico dos meus atendimentos em formato legível por máquina, incluindo consultas, exames e prescrições.',
    status: 'em-analise',
    subject: {
      name: 'Iara Bonfim Castro',
      email: 'iara.castro@exemplo.com.br',
      document: 'CPF ***.532.###-21',
      customerSince: '2020',
      verifiedAt: moment(-2, '09:24'),
    },
    registeredAt: registeredFor(12, '09:24'),
    dueAt: moment(12, '23:59'),
    assignee: CAIO,
    channel: 'Portal do titular, com conta verificada',
    unit: 'Unidade Ribeirão Preto · SP',
    attachments: [],
    timeline: [
      {
        at: moment(-3, '09:24'),
        title: 'Requisição registrada',
        detail: `Protocolo 2026-000452 gerado pelo portal do titular. Prazo legal: ${formatDate(moment(12, '23:59'))}.`,
        author: 'Titular',
      },
    ],
    notes: [],
  },
  {
    protocol: '2026-000392',
    id: 'req_2d94f7c1-2026-0392',
    rightNumeral: 'V',
    description:
      'Preciso do meu histórico de consultas e exames dos últimos cinco anos em arquivo estruturado, para entregar ao novo plano de saúde.',
    status: 'concluida',
    subject: MARINA,
    registeredAt: registeredFor(-5, '08:52'),
    dueAt: moment(-5, '23:59'),
    closedAt: moment(-15, '17:26'),
    assignee: BEATRIZ,
    channel: 'Portal do titular, com conta verificada',
    unit: 'Unidade Centro · Franca/SP',
    attachments: [],
    timeline: [
      {
        at: moment(-15, '17:26'),
        title: 'Atendimento finalizado · Atendido',
        detail:
          'Resposta enviada ao titular e notificação disparada. Pesquisa de satisfação liberada.',
        author: BEATRIZ,
      },
      {
        at: moment(-17, '14:03'),
        title: 'Arquivo de portabilidade gerado',
        detail: 'Exportação em CSV e JSON conferida antes do envio, sem dados de terceiros.',
        author: BEATRIZ,
      },
      {
        at: moment(-19, '09:10'),
        title: 'Identidade verificada',
        detail: 'E-mail confirmado e documento conferido.',
        author: BEATRIZ,
      },
      {
        at: moment(-20, '08:52'),
        title: 'Requisição registrada',
        detail: `Protocolo 2026-000392 gerado pelo portal do titular. Prazo legal: ${formatDate(moment(-5, '23:59'))}.`,
        author: 'Titular',
      },
    ],
    notes: [],
    answer: {
      outcome: 'atendido',
      text: 'Geramos o arquivo com o histórico de consultas, exames e prescrições realizados na rede entre 2021 e 2026, em CSV e em JSON, prontos para importação por outro prestador. O arquivo fica disponível para download por 30 dias na própria requisição; depois disso, basta abrir um novo pedido.',
      sentAt: moment(-15, '17:26'),
      author: BEATRIZ,
    },
    satisfactionRating: 4,
  },
  {
    protocol: '2026-000377',
    id: 'req_6c08fa35-2026-0377',
    rightNumeral: 'III',
    description:
      'A data de nascimento no meu cadastro está errada. Consta 14/03/1987 e o correto é 14/03/1978.',
    status: 'cancelada',
    subject: {
      name: 'Wagner Sipriano Melo',
      email: 'wagner.melo@exemplo.com.br',
      document: 'CPF ***.870.###-55',
      customerSince: '2015',
      verifiedAt: moment(-27, '11:41'),
    },
    registeredAt: registeredFor(-13, '11:30'),
    dueAt: moment(-13, '23:59'),
    closedAt: moment(-25, '19:08'),
    channel: 'Portal do titular, com conta verificada',
    attachments: [],
    timeline: [
      {
        at: moment(-25, '19:08'),
        title: 'Requisição cancelada pelo titular',
        detail:
          'Cancelada pelo portal, sem resposta da organização. Cancelar é ato exclusivo do titular (RF010).',
        author: 'Titular',
      },
      {
        at: moment(-28, '11:30'),
        title: 'Requisição registrada',
        detail: `Protocolo 2026-000377 gerado pelo portal do titular. Prazo legal: ${formatDate(moment(-13, '23:59'))}.`,
        author: 'Titular',
      },
    ],
    notes: [],
  },
]

export function findDemoRequest(protocol: string): DataRequest | undefined {
  return DEMO_REQUESTS.find((request) => request.protocol === protocol)
}
