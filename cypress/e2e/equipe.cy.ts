/**
 * Equipe e permissões — convites de encarregado (RN007) e perfis (RNF009).
 *
 * Enviar convite vai à API. A lista de pessoas e convites ainda é a de
 * demonstração: a API não oferece essa consulta.
 */
import { problem } from '../support/fixtures'

describe('Equipe e permissões', () => {
  beforeEach(() => {
    cy.viewport(1440, 900)
    cy.signIn('encarregado')
    cy.intercept('POST', '/api/organizations/*/invites', {
      statusCode: 202,
      body: { message: 'Convite enviado ao endereço informado.', expiresAt: '2026-10-03T12:00:00.000Z' },
    }).as('invite')
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

  it('convida pela API e mostra o convite na lista', () => {
    cy.contains('button', 'Convidar pessoa').click()
    cy.get('[role="dialog"] input[type="email"]').type('sem-arroba')
    cy.contains('[role="dialog"] button', 'Enviar convite').click()
    cy.contains('Confira o endereço').should('be.visible')

    cy.get('[role="dialog"] input[type="email"]').clear()
    cy.get('[role="dialog"] input[type="email"]').type('dora.lemos@meridianosaude.org.br')
    cy.contains('[role="dialog"] button', 'Enviar convite').click()

    cy.wait('@invite')
      .its('request.body')
      .should('deep.equal', { email: 'dora.lemos@meridianosaude.org.br' })
    cy.contains('[role="dialog"]', 'Convite enviado').should('be.visible')
    cy.contains('[role="dialog"]', 'O link nominal chega por e-mail').should('be.visible')
    cy.contains('[role="dialog"] button', 'Fechar').click()
    cy.contains('li', 'dora.lemos@meridianosaude.org.br').should('contain.text', 'Aguardando aceite')
  })

  it('mostra a recusa do servidor no convite', () => {
    cy.intercept(
      'POST',
      '/api/organizations/*/invites',
      problem(409, 'Este endereço já responde como encarregado desta organização.'),
    )
    cy.contains('button', 'Convidar pessoa').click()
    cy.get('[role="dialog"] input[type="email"]').type('dora.lemos@meridianosaude.org.br')
    cy.contains('[role="dialog"] button', 'Enviar convite').click()

    cy.contains('já responde como encarregado desta organização').should('be.visible')
  })

  it('reenvia um convite vencido pela API', () => {
    cy.contains('li', 'carla.menezes@meridianosaude.org.br').contains('button', 'Reenviar').click()

    cy.wait('@invite')
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
