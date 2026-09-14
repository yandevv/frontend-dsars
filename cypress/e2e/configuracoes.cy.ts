/**
 * Configurações e dados pessoais — RF015 a RF017.
 *
 * O hub com as três seções, a identificação mascarada que se revela por meio
 * minuto, a edição confirmada e a troca de e-mail que fica pendente.
 */
import { TITULAR, page } from '../support/fixtures'
import { serveAccount, servePreferences, serveSecurity } from '../support/servers'

describe('Configurações', () => {
  beforeEach(() => {
    cy.viewport(1440, 900)
    serveAccount(TITULAR)
    serveSecurity()
    servePreferences()
    cy.intercept('GET', '/api/me/requests?*', { body: page([]) })
  })

  it('o hub apresenta as três seções e leva a cada uma', () => {
    cy.visit('/configuracoes')

    cy.get('h1').should('contain.text', 'Configurações')
    cy.contains('h2', 'Dados pessoais').should('be.visible')
    cy.contains('h2', 'Segurança').should('be.visible')
    cy.contains('h2', 'Notificações').should('be.visible')
    cy.contains('dd', 'Verificado').should('be.visible')
    cy.contains('4 dispositivos').should('be.visible')
    cy.get('main').contains('a', 'Abrir dados pessoais').click()
    cy.location('pathname').should('eq', '/configuracoes/dados-pessoais')
  })

  it('"Meus dados" do cabeçalho leva aos dados pessoais', () => {
    cy.visit('/requisicoes')
    cy.get('header').contains('a', 'Meus dados').click()
    cy.location('pathname').should('eq', '/configuracoes/dados-pessoais')
  })

  it('mostra o documento mascarado e revela só por ação explícita, por meio minuto', () => {
    cy.visit('/configuracoes/dados-pessoais')
    cy.contains('•••.•••.789-••').should('be.visible')
    cy.get('main').should('not.contain.text', '476.201.789-04')

    cy.clock()
    cy.contains('dl > div', 'Documento de identificação').contains('button', 'Revelar').click()
    cy.wait('@reveal').its('request.body').should('deep.equal', { fields: ['document'] })
    cy.contains('476.201.789-04').should('be.visible')

    cy.tick(30_000)
    cy.get('main').should('not.contain.text', '476.201.789-04')
  })

  it('edita o telefone depois de confirmar', () => {
    cy.visit('/configuracoes/dados-pessoais')

    cy.contains('dl > div', 'Telefone').contains('button', 'Editar').click()
    cy.contains('dl > div', 'Telefone').find('input').type('16981102233')
    cy.contains('dl > div', 'Telefone').contains('button', 'Salvar').click()

    cy.get('[role="dialog"]').within(() => {
      cy.contains('Confirmar alteração do telefone').should('be.visible')
      cy.contains('(••) •••••-3071').should('be.visible')
      cy.contains('button', 'Salvar alteração').click()
    })
    cy.wait('@updateProfile').its('request.body').should('deep.equal', { phone: '16981102233' })
    cy.contains('Telefone atualizado.').should('be.visible')
    cy.contains('dl > div', 'Telefone').should('contain.text', '-2233')
  })

  it('mostra a recusa do servidor no próprio diálogo', () => {
    cy.visit('/configuracoes/dados-pessoais')

    cy.contains('dl > div', 'Telefone').contains('button', 'Editar').click()
    cy.contains('dl > div', 'Telefone').find('input').type('99991234')
    cy.contains('dl > div', 'Telefone').contains('button', 'Salvar').click()
    cy.get('[role="dialog"]').contains('button', 'Salvar alteração').click()

    cy.get('[role="dialog"]').should('contain.text', 'Informe o DDD e o número do telefone.')
  })

  it('a troca de e-mail fica pendente até a confirmação', () => {
    cy.visit('/configuracoes/dados-pessoais')

    cy.contains('dl > div', 'E-mail').contains('button', 'Editar').click()
    cy.contains('dl > div', 'E-mail').find('input').type('marina.nova@exemplo.com.br')
    cy.contains('dl > div', 'E-mail').contains('button', 'Salvar').click()
    cy.get('[role="dialog"]').contains('button', 'Enviar confirmação').click()

    cy.wait('@emailChange')
      .its('request.body')
      .should('deep.equal', { newEmail: 'marina.nova@exemplo.com.br' })
    cy.contains('Confirme o novo e-mail para concluir a troca').should('be.visible')
    cy.contains('dl > div', 'E-mail').should('contain.text', 'Troca pendente')
    cy.contains('dl > div', 'E-mail').should('contain.text', 'titular@exemplo.com.br')
  })

  it('troca a navegação lateral por abas no celular', () => {
    cy.viewport(360, 780)
    cy.visit('/configuracoes/dados-pessoais')

    cy.get('nav[aria-label="Seções das configurações"] a[aria-current="page"]')
      .filter(':visible')
      .should('contain.text', 'Dados pessoais')
    cy.document().its('documentElement.scrollWidth').should('be.lte', 360)
  })

  it('não expõe os códigos do documento de requisitos na tela', () => {
    cy.visit('/configuracoes')
    cy.get('main').invoke('text').should('not.match', /\b(RF|RN)\d{3}\b/)
  })
})
