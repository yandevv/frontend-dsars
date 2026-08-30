/**
 * Nova requisição — RF004 / art. 18 e art. 19 da LGPD.
 *
 * Percorre a tela como o titular: escolher o direito, ver o prazo aparecer ao
 * lado, descrever o pedido e receber o protocolo.
 */
const DESCRIPTION =
  'Solicito a eliminação dos meus dados de contato usados em campanhas de comunicação da rede.'

describe('Nova requisição', () => {
  beforeEach(() => {
    cy.visit('/requisicoes/nova')
  })

  it('apresenta a tela dentro da moldura do portal do titular', () => {
    cy.get('header').should('contain.text', 'Instituto Meridiano de Saúde')
    cy.get('header').should('contain.text', 'Portal do titular de dados')
    cy.get('h1').should('contain.text', 'Nova requisição')
    cy.get('footer').should('contain.text', 'Portal operado com a plataforma Tutela')
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
    cy.contains('dt', 'Identificador interno').siblings('dd').should('contain.text', 'req_')
    cy.contains('15 dias corridos do registro').should('be.visible')
    cy.contains('Eliminação de dados').should('be.visible')
    cy.contains('Sem anexos').should('be.visible')
    cy.get('form').should('not.exist')
  })

  it('permite registrar outro pedido a partir do comprovante', () => {
    cy.get('input[type="radio"][value="II"]').check()
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
