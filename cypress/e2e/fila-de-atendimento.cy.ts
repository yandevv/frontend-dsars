/**
 * Fila de atendimento — RF008 / RF009.
 *
 * A tela do encarregado: filtrar, ordenar, ver o prazo em destaque e abrir uma
 * requisição. Também confere o que a tela não oferece — cancelar é ato do
 * titular (RF010).
 */
describe('Fila de atendimento', () => {
  beforeEach(() => {
    // A tabela de sete colunas só entra a partir de 1280 px; abaixo disso a
    // fila vira cartões, e é o que o último teste verifica.
    cy.viewport(1440, 900)
    cy.visit('/painel/fila')
  })

  it('abre na área do encarregado, com os indicadores da organização', () => {
    cy.get('header').should('contain.text', 'Área do encarregado de proteção de dados')
    cy.get('h1').should('contain.text', 'Fila de atendimento')
    cy.contains('Em atendimento').should('be.visible')
    cy.contains('Fora do prazo legal').should('be.visible')
    cy.contains('Vencem em até 3 dias').should('be.visible')
  })

  it('não expõe os códigos do documento de requisitos na tela', () => {
    cy.get('main').invoke('text').should('not.match', /\bRF\d{3}\b/)
  })

  it('põe as vencidas no topo e mostra o prazo relativo junto da data', () => {
    cy.get('tbody tr').first().should('contain.text', '2026-000418')
    cy.get('tbody tr').first().should('contain.text', 'Venceu há 2 dias')
    cy.get('tbody tr').first().should('contain.text', 'Marina Torres de Almeida')
  })

  it('filtra pela situação do prazo e registra o recorte no endereço', () => {
    cy.contains('button', 'Vencidas').click()

    cy.location('search').should('contain', 'prazo=vencidas')
    cy.get('tbody tr').should('have.length', 2)
    cy.contains('2 de 8 requisições com os filtros aplicados').should('be.visible')
  })

  it('abre já filtrada quando o endereço traz o recorte', () => {
    cy.visit('/painel/fila?estado=concluida')

    cy.get('tbody tr').should('have.length', 1)
    cy.get('tbody tr').should('contain.text', '2026-000392')
    cy.get('tbody tr').should('contain.text', 'Respondida')
  })

  it('busca por protocolo e por nome do titular', () => {
    cy.get('input[type="search"]').type('000431')
    cy.get('tbody tr').should('have.length', 1)
    cy.get('tbody tr').should('contain.text', 'Rodrigo Amaral Neves')

    cy.get('input[type="search"]').clear()
    cy.get('input[type="search"]').type('marina')
    cy.get('tbody tr').should('have.length', 5)
  })

  it('explica o resultado vazio em vez de mostrar uma tabela em branco', () => {
    cy.visit('/painel/fila?estado=aguardando-complemento&direito=VI')

    cy.contains('Nenhuma requisição com esses filtros').should('be.visible')
    cy.contains('A fila tem 8 requisições no total').should('be.visible')

    cy.get('main').contains('button', 'Limpar filtros').click()
    cy.get('tbody tr').should('have.length', 8)
  })

  it('oferece acessar como única ação em lote — o encarregado não cancela (RF010)', () => {
    cy.get('thead input[type="checkbox"]').check()

    cy.contains('8 requisições selecionadas').should('be.visible')
    cy.contains('button', 'Abrir as 8 em abas').should('be.visible')
    cy.get('main').should('not.contain.text', 'Cancelar')
    cy.get('main').should('not.contain.text', 'Excluir')

    cy.contains('button', 'Desmarcar').click()
    cy.contains('requisições selecionadas').should('not.exist')
  })

  it('leva ao atendimento de uma requisição', () => {
    cy.get('tbody tr').first().contains('a', 'Acessar').click()

    cy.location('pathname').should('eq', '/painel/requisicoes/01a01f0a-da00-7d89-9fae-9ed1e70505ae')
  })

  it('troca a tabela por cartões em tela estreita', () => {
    cy.viewport(390, 844)
    cy.visit('/painel/fila')

    cy.get('table').should('not.be.visible')
    cy.get('main ul li').first().should('contain.text', '2026-000418')
    cy.get('main ul li').first().should('contain.text', 'Venceu há 2 dias')
  })
})
