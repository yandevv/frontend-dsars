import { CANCEL_REASON_MIN_LENGTH, DEADLINE_ALERT_DAYS, LEGAL_DEADLINE_DAYS, MESSAGE_EDIT_WINDOW_MINUTES } from '@/features/requests/constants/requestPolicy'
import { CONFIRMATION_LINK_HOURS } from '@/features/auth/constants/confirmationPolicy'
import { INVITE_VALIDITY_DAYS } from '@/features/auth/constants/invitePolicy'
import { AUDIT_RETENTION_YEARS } from '@/features/audit/constants/auditOperations'
import type { AccountRole } from '@/features/auth/types/auth'
import type { GlossaryTerm, HelpQuestion, HelpSection } from '@/features/help/types/help'

/**
 * O conteúdo da ajuda, por perfil.
 *
 * Os números vêm das mesmas constantes que as telas usam: se o prazo de edição
 * de mensagens mudar, a ajuda muda junto, em vez de ensinar uma regra antiga.
 * O texto evita termos jurídicos sem explicação; os que não dá para evitar
 * estão no glossário, no fim da página.
 */

const TITULAR_SECTIONS: readonly HelpSection[] = [
  {
    id: 'como-pedir',
    title: 'Como fazer um pedido',
    intro:
      'Qualquer pessoa pode perguntar à organização o que ela faz com os seus dados e pedir que algo mude.',
    topics: [
      {
        title: 'Antes de começar',
        text: `Você precisa de uma conta com o e-mail confirmado. O link de confirmação chega por e-mail e vale por ${CONFIRMATION_LINK_HOURS} horas; se vencer, peça outro na própria tela.`,
      },
      {
        title: 'Um direito por pedido',
        text: 'Em "Nova requisição", escolha o direito que quer exercer e descreva o que precisa. Se quiser duas coisas diferentes — uma cópia dos dados e a correção de um endereço, por exemplo —, faça dois pedidos: cada um tem seu prazo e sua resposta.',
      },
      {
        title: 'Anexos',
        text: 'Documentos ajudam a encontrar o atendimento certo, mas não são obrigatórios. São aceitos PDF, JPG e PNG de até 10 MB. Não anexe dados de outras pessoas.',
      },
      {
        title: 'O protocolo',
        text: 'Ao enviar, você recebe um número de protocolo. Guarde-o: é com ele que se acompanha o pedido aqui, fala com a organização ou registra uma reclamação na ANPD.',
      },
    ],
    action: { label: 'Fazer um pedido', to: { name: 'new-request' } },
  },
  {
    id: 'direitos',
    title: 'Seus direitos',
    intro:
      'A lei de proteção de dados garante nove direitos a quem tem dados tratados por uma organização. Estes são os que você pode pedir por aqui.',
    topics: [],
  },
  {
    id: 'prazos',
    title: 'Prazos de resposta',
    intro: `A organização tem prazo para responder, contado a partir do registro do pedido. Confirmação de tratamento e acesso em formato simplificado são respondidos em até 24 horas; os demais pedidos têm até ${LEGAL_DEADLINE_DAYS} dias corridos, e a equipe é avisada quando faltam ${DEADLINE_ALERT_DAYS} dias ou menos.`,
    topics: [],
  },
  {
    id: 'acompanhar',
    title: 'Acompanhar e conversar',
    intro: 'Tudo o que acontece com o pedido aparece nele, em "Minhas requisições".',
    topics: [
      {
        title: 'Em análise',
        text: 'A equipe está trabalhando no pedido. O prazo está correndo.',
      },
      {
        title: 'Aguardando complemento',
        text: 'A equipe precisa de uma informação sua. Responda pela conversa do próprio pedido. O prazo continua correndo durante a espera.',
      },
      {
        title: 'Concluída',
        text: 'A resposta está no pedido, com os arquivos anexados. Depois disso não há mais mensagens nem reabertura; se discordar, faça um novo pedido ou procure a ANPD.',
      },
      {
        title: 'Mensagens',
        text: `Você pode escrever à equipe enquanto o pedido está aberto. Uma mensagem sua pode ser corrigida em até ${MESSAGE_EDIT_WINDOW_MINUTES} minutos e excluída enquanto o pedido estiver aberto — ela some da conversa, mas o registro fica guardado para prestação de contas.`,
      },
    ],
    action: { label: 'Ver minhas requisições', to: { name: 'my-requests' } },
  },
  {
    id: 'cancelar',
    title: 'Cancelar um pedido',
    intro: 'Mudou de ideia? Um pedido em aberto pode ser cancelado a qualquer momento.',
    topics: [
      {
        title: 'Um ou vários',
        text: `Cancele pela linha do pedido ou selecione vários na lista. É preciso escrever o motivo, com pelo menos ${CANCEL_REASON_MIN_LENGTH} caracteres. Pedidos já concluídos ou cancelados não entram.`,
      },
      {
        title: 'Não tem volta',
        text: 'Um pedido cancelado não reabre. Se precisar de novo, faça outro pedido.',
      },
    ],
  },
  {
    id: 'avaliar',
    title: 'Avaliar o atendimento',
    intro:
      'Quando o pedido é concluído, você recebe um convite para dar uma nota e, se quiser, um comentário.',
    topics: [
      {
        title: 'Uma vez por pedido',
        text: 'A avaliação é enviada uma única vez e não pode ser alterada depois. Pedidos cancelados não têm avaliação.',
      },
      {
        title: 'Sem identificação',
        text: 'As notas entram no relatório da organização sem o seu nome nem o protocolo. Evite escrever dados de saúde no comentário.',
      },
    ],
  },
]

const ENCARREGADO_SECTIONS: readonly HelpSection[] = [
  {
    id: 'fila',
    title: 'Fila de atendimento',
    intro: 'A fila mostra todas as requisições da organização, das mais urgentes para as mais folgadas.',
    topics: [
      {
        title: 'Ordem de trabalho',
        text: `Vencidas vêm primeiro, depois as que vencem em até ${DEADLINE_ALERT_DAYS} dias. O fundo da linha segue o prazo, não o estado.`,
      },
      {
        title: 'Filtros no endereço',
        text: 'Estado, direito, prazo e busca ficam na URL. Um recorte pode ser enviado a um colega sem explicação, e recarregar a página não o desfaz.',
      },
    ],
    action: { label: 'Abrir a fila', to: { name: 'request-queue' } },
  },
  {
    id: 'responder',
    title: 'Responder uma requisição',
    intro: 'Toda a troca com o titular acontece dentro da requisição, e tudo fica na trilha de auditoria.',
    topics: [
      {
        title: 'Pedir complemento',
        text: 'Quando falta informação, envie a pergunta como pedido de complemento. A requisição fica aguardando o titular, mas o prazo legal não para.',
      },
      {
        title: 'Finalizar',
        text: 'O parecer vai como a última mensagem e precisa de pelo menos um arquivo com o resultado entregue. Depois de finalizada, a requisição não aceita mensagens e o titular é convidado a avaliar.',
      },
      {
        title: 'Recusar',
        text: 'Uma recusa exige o fundamento que a sustenta, escolhido na lista da organização. Sem ele, o botão não envia.',
      },
      {
        title: 'Notas internas e reatribuição',
        text: 'Notas e trocas de responsável ficam na trilha, mas não aparecem para o titular.',
      },
    ],
  },
  {
    id: 'em-nome',
    title: 'Registrar em nome do titular',
    intro: 'Para pedidos que chegaram por balcão, telefone, e-mail, carta ou ouvidoria.',
    topics: [
      {
        title: 'O que é obrigatório',
        text: 'Identificar o titular, confirmar que a identidade foi verificada, informar o canal e a data em que o pedido chegou. Sem isso não há como justificar o registro nem contar o prazo.',
      },
      {
        title: 'O prazo conta do recebimento',
        text: 'Uma carta registrada dias depois de chegar já entra na fila com esses dias gastos — ou vencida. Não é possível informar data futura.',
      },
      {
        title: 'O titular vê o registro',
        text: 'Se tiver conta, a requisição aparece na lista dele com o aviso de que foi registrada pela encarregada, o canal e as datas. É o que permite contestar um registro que ele não fez.',
      },
    ],
    action: { label: 'Registrar em nome do titular', to: { name: 'request-on-behalf' } },
  },
  {
    id: 'prestacao-de-contas',
    title: 'Relatório e auditoria',
    intro: 'Os dois instrumentos com que a organização demonstra o atendimento.',
    topics: [
      {
        title: 'Relatório gerencial',
        text: 'Totais por direito e por estado, tempo médio e percentual no prazo, filtráveis por período. Toda exportação fica registrada, com quem exportou e o recorte usado.',
      },
      {
        title: 'Registros de auditoria',
        text: `Quem fez o quê, sobre qual recurso e quando. Ninguém edita nem exclui um registro, e eles são guardados por no mínimo ${AUDIT_RETENTION_YEARS} anos.`,
      },
    ],
    action: { label: 'Abrir a auditoria', to: { name: 'audit-log' } },
  },
  {
    id: 'equipe',
    title: 'Equipe',
    intro: 'O perfil de encarregado só é dado por convite; ninguém o escolhe no cadastro.',
    topics: [
      {
        title: 'Convites',
        text: `Só endereços da organização recebem convite, e cada um vale por ${INVITE_VALIDITY_DAYS} dias. Um convite pendente pode ser revogado; um vencido, reenviado.`,
      },
    ],
    action: { label: 'Abrir a equipe', to: { name: 'team' } },
  },
]

const TITULAR_FAQ: readonly HelpQuestion[] = [
  {
    question: 'Não recebi o e-mail de confirmação. E agora?',
    answer:
      'Confira a caixa de spam. Na tela de confirmação há um botão para reenviar o link; ele fica disponível alguns minutos depois de cada envio.',
  },
  {
    question: 'A organização pode recusar meu pedido?',
    answer:
      'Pode, em casos previstos em lei — por exemplo, quando precisa guardar um prontuário por norma sanitária. A recusa vem sempre com o motivo, e você pode questioná-la na ANPD.',
  },
  {
    question: 'Posso pedir em nome de outra pessoa?',
    answer:
      'Pelo portal, cada conta faz pedidos sobre os próprios dados. Para pedir por outra pessoa — um filho menor, por exemplo —, fale com a encarregada pelos contatos abaixo.',
  },
  {
    question: 'Apareceu um pedido que eu não fiz.',
    answer:
      'Pedidos que chegam por telefone, carta ou balcão podem ser registrados pela encarregada, e isso aparece no pedido. Se você não reconhece o pedido, avise a encarregada.',
  },
]

const ENCARREGADO_FAQ: readonly HelpQuestion[] = [
  {
    question: 'O prazo para quando peço complemento?',
    answer:
      'Não. O prazo legal continua correndo enquanto a requisição aguarda o titular. Peça o complemento cedo.',
  },
  {
    question: 'Posso reabrir uma requisição finalizada?',
    answer:
      'Não. Se a resposta precisar ser corrigida, o titular pode fazer um novo pedido citando o protocolo anterior.',
  },
  {
    question: 'Posso apagar uma mensagem que enviei por engano?',
    answer: `Enquanto a requisição estiver aberta, sim: ela some da conversa, mas o conteúdo fica na trilha de auditoria. Para corrigir o texto, há ${MESSAGE_EDIT_WINDOW_MINUTES} minutos depois do envio.`,
  },
  {
    question: 'Um titular diz que não fez um pedido registrado em nome dele.',
    answer:
      'Confira na trilha de auditoria quem registrou, por qual canal e com qual referência. Se o registro não se sustentar, responda ao titular pela própria requisição.',
  },
]

export const GLOSSARY: readonly GlossaryTerm[] = [
  {
    term: 'Titular de dados',
    meaning: 'A pessoa a quem os dados se referem — quem faz os pedidos.',
  },
  {
    term: 'Encarregado de proteção de dados',
    meaning:
      'A pessoa que a organização indicou para receber os pedidos e responder em nome dela. Também chamado de DPO.',
  },
  {
    term: 'Tratamento de dados',
    meaning:
      'Qualquer uso de dados pessoais: coletar, guardar, consultar, compartilhar, apagar.',
  },
  {
    term: 'Anonimização',
    meaning:
      'Transformar os dados de modo que não seja mais possível saber a quem se referem.',
  },
  {
    term: 'Portabilidade',
    meaning: 'Receber os seus dados num formato que outra empresa consiga ler e usar.',
  },
  {
    term: 'ANPD',
    meaning:
      'Autoridade Nacional de Proteção de Dados: o órgão público que fiscaliza a lei e recebe reclamações.',
  },
  {
    term: 'Protocolo',
    meaning: 'O número que identifica um pedido. É o que se cita em qualquer contato sobre ele.',
  },
  {
    term: 'Trilha de auditoria',
    meaning:
      'O registro, que ninguém pode alterar, de tudo o que foi feito nos pedidos e nas contas.',
  },
]

export function sectionsFor(role: AccountRole): readonly HelpSection[] {
  return role === 'titular' ? TITULAR_SECTIONS : ENCARREGADO_SECTIONS
}

export function faqFor(role: AccountRole): readonly HelpQuestion[] {
  return role === 'titular' ? TITULAR_FAQ : ENCARREGADO_FAQ
}
