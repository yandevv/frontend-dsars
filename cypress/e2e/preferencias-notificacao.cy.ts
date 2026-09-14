/**
 * Preferências de notificação — RF020 / RF021.
 *
 * A matriz de evento por canal, montada a partir do catálogo do servidor: as
 * linhas obrigatórias travadas, cada canal independente e o salvamento só
 * depois da confirmação.
 */
import { page } from '../support/fixtures'
import { servePreferences } from '../support/servers'

const toggle = (label: string) => cy.get(`button[role="switch"][aria-label="${label}"]`)

describe('Preferências de notificação', () => {
  beforeEach(() => {
    cy.viewport(1440, 900)
    cy.signIn('titular')
    servePreferences()
    cy.intercept('GET', '/api/me/security', { body: { passwordSet: true, passwordChangedAt: null, sessions: [] } })
    cy.intercept('GET', '/api/me/requests?*', { body: page([]) })
    cy.visit('/configuracoes/notificacoes')
  })

  it('trava os canais das comunicações obrigatórias', () => {
    cy.contains('li', 'Requisição finalizada').should('contain.text', 'Obrigatória')
    toggle('E-mail para Segurança da conta').click()
    toggle('E-mail para Segurança da conta').should('have.attr', 'aria-checked', 'true')
    toggle('E-mail para Segurança da conta').should('have.attr', 'aria-disabled', 'true')
  })

  it('liga e desliga cada canal sem mexer nos outros e salva depois de confirmar', () => {
    cy.get('main').contains('button', 'Salvar preferências').should('be.disabled')

    toggle('E-mail para Pesquisa de satisfação disponível').click()
    toggle('E-mail para Pesquisa de satisfação disponível').should('have.attr', 'aria-checked', 'true')
    toggle('No portal para Pesquisa de satisfação disponível').should('have.attr', 'aria-checked', 'true')
    cy.contains('1 alteração ainda não salva.').should('be.visible')

    cy.get('main').contains('button', 'Salvar preferências').click()
    cy.get('[role="dialog"]').contains('button', 'Salvar preferências').click()

    cy.wait('@savePreferences')
      .its('request.body.preferences')
      .should('deep.include', {
        eventType: 'SATISFACTION_SURVEY_AVAILABLE',
        channel: 'EMAIL',
        enabled: true,
      })
    cy.contains('Preferências de notificação salvas.').should('be.visible')
    cy.get('main').contains('button', 'Salvar preferências').should('be.disabled')
  })

  it('o hub passa a contar os avisos ligados', () => {
    toggle('E-mail para Pesquisa de satisfação disponível').click()
    cy.get('main').contains('button', 'Salvar preferências').click()
    cy.get('[role="dialog"]').contains('button', 'Salvar preferências').click()
    cy.contains('Preferências de notificação salvas.').should('be.visible')

    cy.get('nav[aria-label="Seções das configurações"]').contains('a', 'Visão geral').click()
    cy.contains('Avisos opcionais ligados').parent().should('contain.text', '3 de 3')
  })

  it('empilha a matriz no celular, com o canal ao lado de cada interruptor', () => {
    cy.viewport(360, 780)
    cy.visit('/configuracoes/notificacoes')

    cy.contains('li', 'Pesquisa de satisfação disponível').should('contain.text', 'E-mail')
    cy.document().its('documentElement.scrollWidth').should('be.lte', 360)
  })

  it('não expõe os códigos do documento de requisitos na tela', () => {
    cy.get('main').invoke('text').should('not.match', /\b(RF|RN)\d{3}\b/)
  })
})
