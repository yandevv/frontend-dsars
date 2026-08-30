/**
 * Relatório gerencial — RF028.
 *
 * Os números que o encarregado leva à diretoria e à autoridade, e a regra que
 * impede o relatório de apontar para quem respondeu a pesquisa de satisfação.
 */
describe('Relatório gerencial', () => {
  beforeEach(() => {
    cy.viewport(1440, 900)
    cy.visit('/painel/relatorios')
  })

  it('abre com os quatro indicadores do período padrão', () => {
    cy.get('h1').should('contain.text', 'Relatório gerencial')
    cy.contains('Requisições no período').should('be.visible')
    cy.contains('Tempo médio de atendimento').should('be.visible')
    cy.contains('Concluídas dentro do prazo').should('be.visible')
    cy.contains('Satisfação média').should('be.visible')
    cy.contains('últimos 90 dias').should('be.visible')
  })

  it('não mostra nada que identifique um titular', () => {
    cy.get('main').should('not.contain.text', 'Marina Torres')
    cy.get('main').should('not.contain.text', '@exemplo.com.br')
    cy.get('main').should('not.contain.text', '2026-000418')
    cy.contains('nenhum indicador desta tela identifica titular ou respondente').should('be.visible')
  })

  it('compõe os totais por direito e por estado', () => {
    cy.contains('Total por direito exercido').should('be.visible')
    cy.contains('art. 18, LGPD').should('be.visible')
    cy.contains('Total por estado').should('be.visible')
    cy.contains('concluídas fora do prazo legal').should('be.visible')
  })

  it('recalcula tudo quando o recorte muda', () => {
    cy.contains('35 requisições').should('be.visible')

    cy.get('select').first().select('este-ano')

    cy.contains('35 requisições').should('not.exist')
    cy.contains('este ano').should('be.visible')
  })

  it('oculta a satisfação num recorte estreito demais para ser anônimo', () => {
    cy.get('select').first().select('mes-anterior')
    cy.get('select').eq(1).select('IX')

    cy.contains('Resultados ocultos para preservar o anonimato').should('be.visible')
    cy.contains('Abaixo de 5, a média e a distribuição poderiam apontar').should('be.visible')
    cy.contains('Nota média').should('not.exist')
  })

  it('explica um recorte sem nenhum registro', () => {
    cy.get('select').first().select('mes-anterior')
    cy.get('select').eq(1).select('IX')
    cy.get('select').eq(2).select('cancelada')

    cy.contains('Nenhuma requisição nesse recorte').should('be.visible')
    cy.get('main').contains('button', 'Limpar filtros').click()
    cy.contains('Requisições no período').should('be.visible')
  })

  it('abre o período personalizado com as duas datas', () => {
    cy.get('select').first().select('personalizado')

    cy.get('input[type="date"]').should('have.length', 2)
    cy.contains('label', 'De').should('be.visible')
    cy.contains('label', 'Até').should('be.visible')
  })

  it('oferece os três formatos de exportação, com o recorte no cabeçalho', () => {
    cy.contains('button', 'Exportar relatório').click()

    cy.contains('Planilha CSV').should('be.visible')
    cy.contains('Relatório em PDF').should('be.visible')
    cy.contains('Base analítica anonimizada').should('be.visible')
    cy.contains('sem nome, e-mail ou documento do titular').should('be.visible')
    cy.contains('últimos 90 dias · todos os direitos · todos os estados').should('be.visible')
  })
})
