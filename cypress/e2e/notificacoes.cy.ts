/**
 * Notificações — RF023 a RF027.
 *
 * O contador sempre visível, o painel do sino e a página completa: acionar
 * leva ao recurso e marca como lido; limpar pede confirmação.
 */
const bell = () => cy.get('header button[aria-expanded]').first()


describe('Notificações', () => {
  beforeEach(() => {
    cy.viewport(1440, 900)
  })

  it('o sino mostra o contador e o painel leva ao recurso, marcando como lido', () => {
    cy.visit('/requisicoes')
    bell().should('contain.text', '2')

    bell().click()
    cy.contains('Notificações · 2 não lidas').should('be.visible')
    cy.contains('button', 'O prazo de resposta da 2026-000418 venceu').click()

    cy.location('pathname').should('eq', '/requisicoes/01a01f0a-da00-7d89-9fae-9ed1e70505ae')
    bell().should('contain.text', '1')
  })

  it('a página filtra por abas e explica o recurso indisponível', () => {
    cy.visit('/notificacoes')

    cy.get('h1').should('contain.text', 'Notificações')
    cy.contains('6 notificações, 2 não lidas').should('be.visible')
    cy.contains('[role="tab"]', 'Não lidas').click()
    cy.get('main ul > li').should('have.length', 2)

    cy.contains('[role="tab"]', 'Todas').click()
    cy.contains('button', 'Cancelamento do 2026-000301 confirmado').click()
    cy.contains('Este recurso não está mais disponível').should('be.visible')
    cy.location('pathname').should('eq', '/notificacoes')
  })

  it('marca todas como lidas e zera o contador do cabeçalho', () => {
    cy.visit('/notificacoes')

    cy.get('main').contains('button', 'Marcar todas como lidas').click()
    cy.contains('O contador do cabeçalho zerou').should('be.visible')
    bell().should('not.contain.text', '2')
  })

  it('limpa a listagem só depois da confirmação', () => {
    cy.visit('/notificacoes')

    cy.get('main').contains('button', 'Limpar listagem').click()
    cy.get('[role="dialog"]').contains('button', 'Manter as notificações').click()
    cy.get('main ul > li').should('have.length.greaterThan', 0)

    cy.get('main').contains('button', 'Limpar listagem').click()
    cy.get('[role="dialog"]').contains('button', 'Limpar listagem').click()
    cy.contains('Sua listagem está vazia').should('be.visible')
  })

  it('não expõe os códigos do documento de requisitos na tela', () => {
    cy.visit('/notificacoes')
    cy.get('main').invoke('text').should('not.match', /\b(RF|RN)\d{3}\b/)
  })
})
