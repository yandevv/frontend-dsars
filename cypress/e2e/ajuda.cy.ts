/**
 * Ajuda — conteúdo por perfil, em linguagem clara (RN092).
 *
 * Sem sessão aberta a página fala com o titular; a versão do encarregado está
 * coberta no teste de unidade da tela.
 */
describe('Ajuda', () => {
  beforeEach(() => {
    cy.viewport(1440, 900)
    cy.visit('/ajuda')
  })

  it('explica ao titular como pedir, os direitos e os prazos', () => {
    cy.get('h1').should('contain.text', 'Ajuda')
    cy.contains('h2', 'Como fazer um pedido').should('be.visible')
    cy.get('#direitos li').should('have.length', 9)
    cy.contains('Resposta imediata').should('be.visible')
    cy.get('main').invoke('text').should('not.match', /\bRN\d{3}\b|art\.\s*\d/)
  })

  it('leva à seção pelo índice e abre as perguntas uma a uma', () => {
    cy.contains('nav a', 'Perguntas frequentes').click()
    cy.location('hash').should('eq', '#perguntas')

    cy.contains('summary', 'A organização pode recusar meu pedido?').click()
    cy.contains('A recusa vem sempre com o motivo').should('be.visible')
  })

  it('termina com o contato da encarregada e o glossário', () => {
    cy.contains('h2', 'Glossário').should('exist')
    cy.contains('dt', 'ANPD').should('exist')
    cy.get('#contato').should('contain.text', 'dpo@meridianosaude.org.br')
  })

  it('leva ao formulário de pedido', () => {
    cy.contains('a', 'Fazer um pedido').click()
    cy.location('pathname').should('eq', '/requisicoes/nova')
  })

  it('cabe no celular sem rolagem lateral', () => {
    cy.viewport(360, 780)
    cy.document().its('documentElement.scrollWidth').should('be.lte', 360)
  })
})
