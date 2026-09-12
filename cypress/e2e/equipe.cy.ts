/**
 * Equipe e permissões — convites de encarregado (RN007) e perfis (RNF009).
 */
describe('Equipe e permissões', () => {
  beforeEach(() => {
    cy.viewport(1440, 900)
    cy.visit('/painel/equipe')
  })

  it('mostra as pessoas, os convites e o que cada perfil pode fazer', () => {
    cy.get('h1').should('contain.text', 'Equipe e permissões')
    cy.get('tbody tr').should('have.length', 3)
    cy.contains('tr', 'Helena Prado Vasconcelos').should('contain.text', 'Responsável')
    cy.contains('li', 'bruno.carvalho@meridianosaude.org.br').should('contain.text', 'Aguardando aceite')
    cy.contains('li', 'carla.menezes@meridianosaude.org.br').should('contain.text', 'Vencido')
    cy.contains('Registros de auditoria').should('be.visible')
    cy.get('main').invoke('text').should('not.match', /\bRN[F]?\d{3}\b/)
  })

  it('convida alguém da organização e recusa endereço de fora', () => {
    cy.contains('button', 'Convidar pessoa').click()
    cy.get('[role="dialog"] input[type="email"]').type('fulano@gmail.com')
    cy.contains('[role="dialog"] button', 'Enviar convite').click()
    cy.contains('Só endereços @meridianosaude.org.br recebem convite').should('be.visible')

    cy.get('[role="dialog"] input[type="email"]').clear()
    cy.get('[role="dialog"] input[type="email"]').type('dora.lemos@meridianosaude.org.br')
    cy.contains('[role="dialog"] button', 'Enviar convite').click()

    cy.contains('[role="dialog"]', 'Convite enviado').should('be.visible')
    cy.get('[data-convite]').should('contain.text', '/convite/')
    cy.contains('[role="dialog"] button', 'Fechar').click()
    cy.contains('li', 'dora.lemos@meridianosaude.org.br').should('contain.text', 'Aguardando aceite')
  })

  it('revoga um convite depois de confirmar', () => {
    cy.contains('li', 'bruno.carvalho@meridianosaude.org.br').contains('button', 'Revogar').click()
    cy.contains('[role="dialog"]', 'Revogar o convite?').should('be.visible')
    cy.contains('[role="dialog"] button', 'Revogar convite').click()

    cy.contains('O link deixou de funcionar').should('be.visible')
    cy.contains('li', 'bruno.carvalho@meridianosaude.org.br').should('contain.text', 'Revogado')
  })

  it('reenvia um convite vencido', () => {
    cy.contains('li', 'carla.menezes@meridianosaude.org.br').contains('button', 'Reenviar').click()

    cy.contains('Novo convite enviado para carla.menezes@meridianosaude.org.br').should('be.visible')
    cy.contains('li', 'carla.menezes@meridianosaude.org.br').should('contain.text', 'Aguardando aceite')
  })

  it('cabe no celular sem rolagem lateral', () => {
    cy.viewport(360, 780)

    cy.get('table').should('not.be.visible')
    cy.contains('li', 'Beatriz Falcão Ribeiro').should('be.visible')
    cy.document().its('documentElement.scrollWidth').should('be.lte', 360)
  })
})
