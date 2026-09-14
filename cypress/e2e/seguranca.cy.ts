/**
 * Segurança da conta — RF018 / RF019.
 *
 * Senha e sessões: trocar a senha pede a atual e encerra as outras sessões;
 * encerrar uma sessão é imediato; encerrar todas pede confirmação.
 */
import { serveSecurity } from '../support/servers'

describe('Segurança', () => {
  beforeEach(() => {
    cy.viewport(1440, 900)
    cy.signIn('titular')
    serveSecurity()
    cy.visit('/configuracoes/seguranca')
  })

  it('mostra a última troca de senha e as sessões ativas', () => {
    cy.get('h1').should('contain.text', 'Segurança')
    cy.contains(/Alterada em \d{2}\/\d{2}\/\d{4}/).should('be.visible')
    cy.contains('4 dispositivos conectados').should('be.visible')
    cy.contains('li', 'Esta sessão').should('contain.text', 'Chrome em Windows')
  })

  it('encerra uma sessão de outro aparelho', () => {
    cy.contains('li', 'Chrome em Android').contains('button', 'Encerrar').click()

    cy.wait('@endSession')
    cy.contains('Sessão em Chrome em Android encerrada.').should('be.visible')
    cy.contains('3 dispositivos conectados').should('be.visible')
  })

  it('encerra as outras sessões depois de confirmar', () => {
    cy.get('main').contains('button', 'Encerrar as outras sessões').click()
    cy.get('[role="dialog"]').contains('button', 'Manter conectadas').click()
    cy.contains('4 dispositivos conectados').should('be.visible')

    cy.get('main').contains('button', 'Encerrar as outras sessões').click()
    cy.get('[role="dialog"]').contains('button', 'Encerrar sessões').click()
    cy.contains('3 sessões encerradas. Esta sessão continua ativa.').should('be.visible')
    cy.get('main').contains('button', 'Encerrar as outras sessões').should('be.disabled')
  })

  it('mostra a recusa do servidor quando a senha atual não confere', () => {
    cy.contains('button', 'Alterar senha').click()

    cy.get('[role="dialog"]').within(() => {
      cy.contains('label', 'Senha atual').click()
      cy.focused().type('errada')
      cy.contains('label', 'Nova senha').click()
      cy.focused().type('OutraSenhaForte#2026')
      cy.contains('label', 'Repetir a nova senha').click()
      cy.focused().type('OutraSenhaForte#2026')
      cy.contains('button', 'Salvar e encerrar sessões').click()
      cy.contains('A senha atual não confere.').should('be.visible')
    })
  })

  it('troca a senha com os critérios à vista e encerra as outras sessões', () => {
    cy.contains('button', 'Alterar senha').click()

    cy.get('[role="dialog"]').within(() => {
      cy.contains('button', 'Salvar e encerrar sessões').click()
      cy.contains('Informe a senha atual para continuar.').should('be.visible')

      cy.contains('label', 'Senha atual').click()
      cy.focused().type('SenhaSegura!123')
      cy.contains('label', 'Nova senha').click()
      cy.focused().type('OutraSenhaForte#2026')
      cy.contains('label', 'Repetir a nova senha').click()
      cy.focused().type('OutraSenhaForte#2026')
      cy.contains('button', 'Salvar e encerrar sessões').click()
    })

    cy.wait('@password').its('request.body').should('deep.equal', {
      currentPassword: 'SenhaSegura!123',
      password: 'OutraSenhaForte#2026',
      passwordConfirmation: 'OutraSenhaForte#2026',
    })
    cy.contains('Senha alterada e 3 sessões encerradas.').should('be.visible')
    cy.contains('1 dispositivo conectado').should('be.visible')
  })

  it('não expõe os códigos do documento de requisitos na tela', () => {
    cy.get('main').invoke('text').should('not.match', /\b(RF|RN)\d{3}\b/)
  })
})
