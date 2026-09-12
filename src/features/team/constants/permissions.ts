/**
 * O que cada perfil pode fazer na plataforma, como a tela da equipe mostra.
 *
 * É informação, não controle: quem decide o que cada perfil acessa é o
 * servidor, a cada chamada. Esta tabela só descreve essa regra para quem
 * gerencia a equipe.
 */
export interface PermissionRow {
  operation: string
  titular: string | null
  encarregado: string | null
}

export const PERMISSIONS: readonly PermissionRow[] = [
  {
    operation: 'Registrar requisição',
    titular: 'As próprias',
    encarregado: 'Em nome do titular, com canal de origem',
  },
  { operation: 'Ver requisições', titular: 'Só as próprias', encarregado: 'Todas da organização' },
  { operation: 'Trocar mensagens', titular: 'Nas próprias', encarregado: 'Em todas as abertas' },
  { operation: 'Pedir complemento e finalizar', titular: null, encarregado: 'Sim' },
  { operation: 'Reatribuir responsável', titular: null, encarregado: 'Sim' },
  { operation: 'Cancelar requisição', titular: 'As próprias, em aberto', encarregado: null },
  { operation: 'Responder pesquisa de satisfação', titular: 'As próprias, concluídas', encarregado: null },
  { operation: 'Relatório gerencial', titular: null, encarregado: 'Consultar e exportar' },
  { operation: 'Registros de auditoria', titular: null, encarregado: 'Consultar e exportar' },
  { operation: 'Convidar e revogar convites', titular: null, encarregado: 'Sim' },
]
