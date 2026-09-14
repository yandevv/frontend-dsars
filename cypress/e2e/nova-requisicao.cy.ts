/**
 * Nova requisição — RF004 / art. 18 e art. 19 da LGPD.
 *
 * Percorre a tela como o titular: escolher o direito, ver o prazo aparecer ao
 * lado, descrever o pedido e receber o protocolo.
 */
import { DAY, HOUR, fromNow } from '../support/fixtures'

const DESCRIPTION =
  'Solicito a eliminação dos meus dados de contato usados em campanhas de comunicação da rede.'

/** O portal da organização registra e devolve protocolo, identificador e prazo. */
function acceptRegistration() {
  cy.intercept('POST', '/api/portal/demonstracao/requests', (request) => {
    const body = String(request.body)
    const simplified = body.includes('SIMPLIFIED')
    request.reply({
      statusCode: 201,
      body: {
        id: '01920000-0000-7000-8000-000000000461',
        protocolNumber: '2026-000461',
        rights: ['CONSENTED_DATA_DELETION'],
        responseFormat: simplified ? 'SIMPLIFIED' : 'COMPLETE',
        status: 'OPEN',
        registeredAt: fromNow(0),
        dueAt: fromNow(simplified ? 24 * HOUR : 15 * DAY),
        deadlineStatus: simplified ? 'DUE_SOON' : 'ON_TIME',
        attachments: [],
      },
    })
  }).as('register')
}

describe('Nova requisição', () => {
  beforeEach(() => {
    cy.signIn('titular')
    acceptRegistration()
    cy.visit('/requisicoes/nova')
  })

  it('apresenta a tela dentro da moldura do portal do titular', () => {
    cy.get('header').should('contain.text', 'Instituto Meridiano de Saúde')
    cy.get('header').should('contain.text', 'Portal do titular de dados')
    cy.get('h1').should('contain.text', 'Nova requisição')
    cy.get('footer').should('contain.text', 'Portal operado com a plataforma Tutela')
  })

  it('não expõe os códigos do documento de requisitos na tela', () => {
    cy.get('main').invoke('text').should('not.match', /\bRF\d{3}\b/)
  })

  it('oferece os nove direitos do art. 18 e só um por requisição', () => {
    cy.get('input[type="radio"]').should('have.length', 9)
    cy.contains('Eliminação de dados').should('be.visible')
    cy.contains('Revogação do consentimento').should('be.visible')

    cy.get('input[type="radio"]').eq(1).check()
    cy.get('input[type="radio"]').eq(5).check()
    cy.get('input[type="radio"]:checked').should('have.length', 1)
  })

  it('mostra o prazo assim que o direito é escolhido, antes do envio', () => {
    cy.contains('Escolha o direito para ver o prazo').should('be.visible')

    cy.get('input[type="radio"][value="VI"]').check()

    cy.contains('15 dias · até').should('be.visible')
    cy.contains('conforme o art. 19 da LGPD').should('be.visible')
  })

  it('pede o formato do acesso e dá 24 horas ao simplificado', () => {
    cy.get('input[type="radio"][value="II"]').check()
    cy.contains('Escolha o formato para ver o prazo').should('be.visible')

    cy.contains('label', 'Declaração completa').click()
    cy.contains('15 dias · até').should('be.visible')

    cy.contains('label', 'Formato simplificado').click()
    cy.get('aside').should('contain.text', 'Em até 24 horas · até')

    cy.get('textarea').type(DESCRIPTION)
    cy.get('button[type="submit"]').click()
    cy.wait('@register').its('request.body').should('include', 'DATA_ACCESS').and('include', 'SIMPLIFIED')
    cy.contains('Resposta imediata, em até 24 horas do registro').should('be.visible')
  })

  it('dá 24 horas à confirmação de tratamento', () => {
    cy.get('input[type="radio"][value="I"]').check()

    cy.get('aside').should('contain.text', 'Em até 24 horas · até')
    cy.contains('Como você quer receber os dados?').should('not.exist')
  })

  it('recusa o envio incompleto e aponta o que falta', () => {
    cy.get('button[type="submit"]').click()

    cy.contains('Faltam dois campos obrigatórios').should('be.visible')
    cy.contains('Escolha o direito exercido e descreva o pedido para enviar.').should('be.visible')
    cy.get('form').should('exist')
  })

  it('recusa uma descrição curta demais para ser atendida', () => {
    cy.get('input[type="radio"][value="VI"]').check()
    cy.get('textarea').type('quero meus dados')
    cy.get('button[type="submit"]').click()

    cy.contains('mínimo de 20 caracteres').should('be.visible')
    cy.get('form').should('exist')
  })

  it('registra o pedido e entrega protocolo, identificador e prazo', () => {
    cy.get('input[type="radio"][value="VI"]').check()
    cy.get('textarea').type(DESCRIPTION)
    cy.get('button[type="submit"]').click()

    cy.contains('Recebemos seu pedido e o prazo já está contando').should('be.visible')
    cy.contains('dt', 'Protocolo')
      .siblings('dd')
      .invoke('text')
      .should('match', /2026-000\d{3}/)
    cy.contains('dt', 'Identificador interno')
      .siblings('dd')
      .invoke('text')
      .should('match', /[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/)
    cy.contains('15 dias corridos do registro').should('be.visible')
    cy.contains('Eliminação de dados').should('be.visible')
    cy.contains('Sem anexos').should('be.visible')
    cy.get('form').should('not.exist')
  })

  it('envia os anexos junto com o pedido', () => {
    cy.get('input[type="radio"][value="VI"]').check()
    cy.get('textarea').type(DESCRIPTION)
    cy.get('input[type="file"]').selectFile(
      {
        contents: Cypress.Buffer.from('%PDF-1.4 documento'),
        fileName: 'documento-identidade.pdf',
        mimeType: 'application/pdf',
      },
      { force: true },
    )
    cy.get('button[type="submit"]').click()

    cy.wait('@register')
      .its('request.body')
      .should('include', 'CONSENTED_DATA_DELETION')
      .and('include', 'documento-identidade.pdf')
  })

  it('permite registrar outro pedido a partir do comprovante', () => {
    cy.get('input[type="radio"][value="III"]').check()
    cy.get('textarea').type(DESCRIPTION)
    cy.get('button[type="submit"]').click()

    cy.contains('button', 'Registrar outro pedido').click()

    cy.get('form').should('exist')
    cy.get('input[type="radio"]:checked').should('have.length', 0)
    cy.contains('Escolha o direito para ver o prazo').should('be.visible')
  })

  it('empilha as colunas e recolhe a navegação em tela estreita', () => {
    cy.viewport(360, 800)
    cy.visit('/requisicoes/nova')

    cy.contains('Instituto Meridiano').should('be.visible')
    cy.get('nav').contains('Meus dados').should('not.be.visible')
    cy.get('h1').should('contain.text', 'Nova requisição')
    cy.contains('Prazo desta requisição').should('exist')
  })
})
