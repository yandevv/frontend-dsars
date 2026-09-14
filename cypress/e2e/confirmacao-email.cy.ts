/**
 * Confirmação de e-mail — RF002 / RF017.
 *
 * A espera, com o intervalo mínimo de reenvio, e os resultados da validação
 * do link: confirmado no cadastro, confirmado na troca e inválido — vencido,
 * usado e inexistente respondem igual.
 */
import { TITULAR, problem } from '../support/fixtures'

const INVALID = 'Este link de confirmação não é mais válido. Solicite o envio de um novo.'

describe('Confirmação de e-mail', () => {
  beforeEach(() => {
    cy.viewport(1280, 900)
    cy.intercept('POST', '/api/auth/confirm-email/resend', { statusCode: 202, body: {} }).as('resend')
    cy.intercept('POST', '/api/auth/confirm-email', (request) => {
      const { token } = request.body as { token: string }
      request.reply(token === 'ficha-valida' ? { body: { message: 'ok' } } : problem(400, INVALID))
    }).as('confirm')
  })

  it('espera a confirmação do cadastro com o endereço e o reenvio', () => {
    cy.visit('/confirmar-email?origem=cadastro&email=nova@exemplo.com.br')

    cy.get('h1').should('contain.text', 'Confirme seu e-mail para ativar a conta')
    cy.contains('nova@exemplo.com.br').should('be.visible')
    cy.contains('button', 'Reenviar link').click()

    cy.wait('@resend').its('request.body').should('deep.equal', { email: 'nova@exemplo.com.br' })
    cy.contains('button', /Novo envio em 0[45]:\d\d/).should('be.disabled')
    cy.contains('Já enviamos um link há pouco').should('be.visible')
  })

  it('explica a troca de e-mail, que só vale depois da confirmação', () => {
    cy.visit('/confirmar-email?origem=troca&email=novo@exemplo.com.br')

    cy.contains('Alteração de e-mail').should('be.visible')
    cy.contains('seu e-mail atual continua valendo').should('be.visible')
  })

  it('confirma o cadastro pelo link que chega no e-mail', () => {
    cy.visit('/confirmar-email?token=ficha-valida')

    cy.wait('@confirm').its('request.body').should('deep.equal', { token: 'ficha-valida' })
    cy.get('h1').should('contain.text', 'E-mail confirmado. Conta ativada.')
    cy.contains('a', 'Entrar no portal').should('have.attr', 'href', '/entrar')
  })

  it('mostra o novo e-mail em vigor na troca, com a sessão da própria conta', () => {
    cy.signIn('titular')
    cy.intercept('POST', '/api/me/email-change/confirm', {
      body: { message: 'Endereço de e-mail alterado.', email: 'marina.nova@exemplo.com.br' },
    }).as('confirmChange')

    cy.visit('/confirmar-novo-email?token=ficha-da-troca')

    cy.wait('@confirmChange')
    cy.get('h1').should('contain.text', 'Novo e-mail em vigor')
    cy.contains('marina.nova@exemplo.com.br').should('be.visible')
    cy.contains(TITULAR.email).should('be.visible')
  })

  it('pede o acesso antes de confirmar a troca sem sessão', () => {
    cy.visit('/confirmar-novo-email?token=ficha-da-troca')

    cy.location('pathname').should('eq', '/entrar')
    cy.location('search').should('contain', 'redirect=')
  })

  it('recusa link vencido, usado ou inexistente sem dizer se existe conta', () => {
    cy.visit('/confirmar-email?token=nao-existe')

    cy.get('h1').should('contain.text', 'Não conseguimos usar este link')
    cy.contains('ter vencido').should('be.visible')
    cy.contains('a', 'Ir para o login').should('have.attr', 'href', '/entrar')
  })

  it('não expõe os códigos do documento de requisitos na tela', () => {
    cy.visit('/confirmar-email?origem=cadastro&email=x@exemplo.com.br')
    cy.get('main').invoke('text').should('not.match', /\b(RF|RN)\d{3}\b/)
  })
})
