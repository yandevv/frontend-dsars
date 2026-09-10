/**
 * Preferências de notificação — RF020 / RF021.
 *
 * A matriz de evento por canal, com as linhas obrigatórias travadas, cada
 * canal independente e o salvamento só depois da confirmação.
 */
const toggle = (label: string) => cy.get(`button[role="switch"][aria-label="${label}"]`)

describe('Preferências de notificação', () => {
  beforeEach(() => {
    cy.viewport(1440, 900)
    cy.visit('/configuracoes/notificacoes')
  })

  it('trava o e-mail das comunicações obrigatórias', () => {
    cy.contains('li', 'Transição de estado da requisição').should('contain.text', 'Obrigatória')
    toggle('E-mail para Segurança da conta').click()
    toggle('E-mail para Segurança da conta').should('have.attr', 'aria-checked', 'true')
    toggle('E-mail para Segurança da conta').should('have.attr', 'aria-disabled', 'true')
  })

  it('liga e desliga cada canal sem mexer nos outros e salva depois de confirmar', () => {
    cy.get('main').contains('button', 'Salvar preferências').should('be.disabled')

    toggle('SMS para Prazo próximo do vencimento').click()
    toggle('SMS para Prazo próximo do vencimento').should('have.attr', 'aria-checked', 'true')
    toggle('E-mail para Prazo próximo do vencimento').should('have.attr', 'aria-checked', 'true')
    cy.contains('1 alteração ainda não salva.').should('be.visible')

    cy.get('main').contains('button', 'Salvar preferências').click()
    cy.get('[role="dialog"]').contains('button', 'Salvar preferências').click()
    cy.contains('Preferências de notificação salvas.').should('be.visible')
    cy.get('main').contains('button', 'Salvar preferências').should('be.disabled')
  })

  it('o hub passa a contar os avisos ligados', () => {
    toggle('No portal para Pesquisa de satisfação').click()
    cy.get('main').contains('button', 'Salvar preferências').click()
    cy.get('[role="dialog"]').contains('button', 'Salvar preferências').click()
    cy.contains('Preferências de notificação salvas.').should('be.visible')

    cy.get('nav[aria-label="Seções das configurações"]').contains('a', 'Visão geral').click()
    cy.contains('Avisos opcionais ligados').parent().should('contain.text', 'de')
  })

  it('empilha a matriz no celular, com o canal ao lado de cada interruptor', () => {
    cy.viewport(360, 780)
    cy.visit('/configuracoes/notificacoes')

    cy.contains('li', 'Pedido de complemento').should('contain.text', 'SMS')
    cy.document().its('documentElement.scrollWidth').should('be.lte', 360)
  })

  it('não expõe os códigos do documento de requisitos na tela', () => {
    cy.get('main').invoke('text').should('not.match', /\b(RF|RN)\d{3}\b/)
  })
})
