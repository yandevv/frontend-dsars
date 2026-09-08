/**
 * Confirmação de e-mail — RF002 / RF017.
 *
 * A espera, com o intervalo mínimo de reenvio, e os resultados da validação
 * do link: confirmado no cadastro, confirmado na troca, vencido e inválido.
 */
describe('Confirmação de e-mail', () => {
  beforeEach(() => {
    cy.viewport(1280, 900)
  })

  it('espera a confirmação do cadastro com o endereço e o reenvio', () => {
    cy.visit('/confirmar-email?origem=cadastro&email=nova@exemplo.com.br')

    cy.get('h1').should('contain.text', 'Confirme seu e-mail para ativar a conta')
    cy.contains('nova@exemplo.com.br').should('be.visible')
    cy.contains('button', 'Reenviar link').click()
    cy.contains('button', /Novo envio em 0[45]:\d\d/).should('be.disabled')
    cy.contains('Já enviamos um link há pouco').should('be.visible')
  })

  it('explica a troca de e-mail, que só vale depois da confirmação', () => {
    cy.visit('/confirmar-email?origem=troca&email=novo@exemplo.com.br')

    cy.contains('Alteração de e-mail').should('be.visible')
    cy.contains('seu e-mail atual continua valendo').should('be.visible')
  })

  it('confirma o cadastro e libera o acesso da conta pendente', () => {
    cy.visit('/confirmar-email/demo-cadastro')

    cy.get('h1').should('contain.text', 'E-mail confirmado. Conta ativada.')
    cy.contains('a', 'Entrar no portal').click()

    cy.get('input[autocomplete="email"]').should('have.value', 'pendente@exemplo.com.br')
    cy.get('input[autocomplete="current-password"]').type('SenhaSegura!123')
    cy.get('button[type="submit"]').click()
    cy.contains('Autenticado como titular').should('be.visible')
  })

  it('mostra o novo e-mail em vigor na troca', () => {
    cy.visit('/confirmar-email/demo-troca')

    cy.get('h1').should('contain.text', 'Novo e-mail em vigor')
    cy.contains('Substitui').should('be.visible')
  })

  it('pede outro link quando o anterior venceu', () => {
    cy.visit('/confirmar-email/demo-expirado')

    cy.get('h1').should('contain.text', 'Este link venceu')
    cy.contains('button', 'Enviar novo link').click()
    cy.location('pathname').should('eq', '/confirmar-email')
    cy.contains('pendente@exemplo.com.br').should('be.visible')
  })

  it('recusa um link inválido sem dizer se existe conta', () => {
    cy.visit('/confirmar-email/nao-existe')

    cy.get('h1').should('contain.text', 'Não conseguimos usar este link')
    cy.contains('a', 'Ir para o login').should('have.attr', 'href', '/entrar')
  })

  it('não expõe os códigos do documento de requisitos na tela', () => {
    cy.visit('/confirmar-email?origem=cadastro&email=x@exemplo.com.br')
    cy.get('main').invoke('text').should('not.match', /\b(RF|RN)\d{3}\b/)
  })
})
