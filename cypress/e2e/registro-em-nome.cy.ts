/**
 * Registrar requisição em nome do titular — RF004 (variante) / RN018.
 *
 * O pedido chegou por outro canal: a encarregada identifica a conta do
 * titular pelo e-mail, informa o canal e registra. O prazo conta do registro.
 */
import { DAY, fromNow, page, problem, queueSummaries } from '../support/fixtures'

const DESCRIPTION =
  'Carta assinada pedindo a exclusão dos dados usados em campanhas. Identidade conferida pela cópia do RG anexada.'

const CREATED = '01920000-0000-7000-8000-000000000470'

function acceptRegistration() {
  cy.intercept('POST', '/api/organizations/*/requests', {
    statusCode: 201,
    body: {
      id: CREATED,
      protocolNumber: '2026-000470',
      rights: ['ANONYMIZATION_BLOCKING_OR_DELETION'],
      responseFormat: 'COMPLETE',
      status: 'OPEN',
      registeredAt: fromNow(0),
      dueAt: fromNow(15 * DAY),
      deadlineStatus: 'ON_TIME',
      attachments: [],
    },
  }).as('register')
}

describe('Registrar em nome do titular', () => {
  beforeEach(() => {
    cy.signIn('encarregado')
    cy.intercept('GET', '/api/organizations/*/requests?*', { body: page(queueSummaries()) })
  })

  it('parte da fila e registra um pedido que chegou por carta', () => {
    acceptRegistration()
    cy.viewport(1440, 900)
    cy.visit('/painel/fila')
    cy.contains('a', 'Registrar em nome do titular').click()

    cy.location('pathname').should('eq', '/painel/requisicoes/nova')
    cy.get('h1').should('contain.text', 'Registrar requisição em nome do titular')

    cy.contains('button', 'Registrar requisição').click()
    cy.contains('Revise os campos marcados para registrar').should('be.visible')

    cy.get('input[type="email"]').type('titular@exemplo.com.br')
    cy.contains('label', 'Confirmo que verifiquei a identidade').click()

    cy.contains('label', 'Carta').click()
    cy.get('input[placeholder^="Ex.: atendimento"]').type('Carta nº 219/2026')
    cy.get('aside').should('contain.text', '15 dias · até')

    cy.contains('label', 'Anonimização').click()
    cy.get('textarea').type(DESCRIPTION)
    cy.contains('button', 'Registrar requisição').click()

    cy.wait('@register')
      .its('request.body')
      .should('include', 'titular@exemplo.com.br')
      .and('include', 'POSTAL_MAIL')
      .and('include', 'Carta nº 219/2026')
    cy.contains('Requisição registrada').should('be.visible')
    cy.get('h1').should('contain.text', 'criado para titular@exemplo.com.br')
    cy.contains('Carta · Carta nº 219/2026').should('be.visible')
    cy.contains('A requisição já aparece na lista do titular').should('be.visible')
    cy.contains('a', 'Abrir a requisição').should('have.attr', 'href', `/painel/requisicoes/${CREATED}`)
  })

  it('explica quando o e-mail não tem conta ativa e confirmada', () => {
    cy.intercept(
      'POST',
      '/api/organizations/*/requests',
      problem(
        422,
        'Não há conta ativa e com e-mail confirmado para este endereço. Oriente o titular a se cadastrar na plataforma antes de registrar a requisição em seu nome.',
      ),
    )
    cy.viewport(1440, 900)
    cy.visit('/painel/requisicoes/nova')

    cy.get('input[type="email"]').type('sem-conta@exemplo.com.br')
    cy.contains('label', 'Confirmo que verifiquei a identidade').click()
    cy.contains('label', 'Telefone').click()
    cy.contains('label', 'Correção').click()
    cy.get('textarea').type(DESCRIPTION)
    cy.contains('button', 'Registrar requisição').click()

    cy.contains('Oriente o titular a se cadastrar na plataforma').should('be.visible')
  })

  it('no celular vira três passos, cada um conferido antes de seguir', () => {
    acceptRegistration()
    cy.viewport(360, 780)
    cy.visit('/painel/requisicoes/nova')

    cy.contains('Passo 1 de 3 · Titular').should('be.visible')
    cy.contains('2. Origem do pedido').should('not.be.visible')

    cy.contains('button', 'Continuar para a origem').click()
    cy.contains('Informe o e-mail da conta do titular').should('be.visible')

    cy.get('input[type="email"]').type('titular@exemplo.com.br')
    cy.contains('label', 'Confirmo que verifiquei a identidade').click()
    cy.contains('button', 'Continuar para a origem').click()

    cy.contains('Passo 2 de 3 · Origem').should('be.visible')
    cy.contains('label', 'Presencial').click()
    cy.contains('button', 'Continuar para o pedido').click()

    cy.contains('Passo 3 de 3 · Pedido').should('be.visible')
    cy.contains('label', 'Acesso').click()
    cy.contains('label', 'Declaração completa').click()
    cy.get('textarea').type(DESCRIPTION)
    cy.contains('button', 'Registrar requisição').click()

    cy.get('h1').should('contain.text', 'criado para titular@exemplo.com.br')
    cy.document().its('documentElement.scrollWidth').should('be.lte', 360)
  })
})
