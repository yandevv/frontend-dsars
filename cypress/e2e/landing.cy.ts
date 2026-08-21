// Percorre a página inicial pública como um titular de dados faria.

describe('Página inicial pública', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('explica ao titular o que o portal faz', () => {
    cy.get('h1').should('contain', 'Peça acesso, correção ou exclusão dos seus dados pessoais')
    cy.get('header').should('contain', 'Instituto Meridiano')
    cy.get('footer').should('contain', 'CNPJ 12.345.678/0001-90')
  })

  it('lista os nove direitos do art. 18 da LGPD', () => {
    cy.contains('h2', 'O que você pode pedir')
      .parents('section')
      .within(() => {
        cy.get('ol[role="list"] > li').should('have.length', 9)
        cy.get('ol > li').first().should('contain', 'Confirmação de tratamento')
        cy.get('ol > li').last().should('contain', 'Revogação do consentimento')
        cy.contains('art. 18 da LGPD').should('be.visible')
      })
  })

  it('descreve as três etapas do atendimento', () => {
    cy.contains('h2', 'Como o atendimento funciona')
      .parents('section')
      .within(() => {
        cy.get('ol[role="list"] > li').should('have.length', 3)
      })
  })

  it('permite falar com a encarregada sem precisar de conta', () => {
    cy.get('a[href^="mailto:"]').should('have.attr', 'href', 'mailto:dpo@meridianosaude.org.br')
    cy.get('a[href^="tel:"]').should('have.attr', 'href', 'tel:+551637110480')
  })

  it('leva ao cadastro pela chamada principal', () => {
    cy.get('main').contains('a', 'Registrar-se').click()

    cy.location('pathname').should('eq', '/registrar')
    cy.get('h1').should('contain', 'Criar conta')
  })

  it('leva ao acesso pela chamada secundária', () => {
    cy.get('main').contains('a', 'Já tenho conta').click()

    cy.location('pathname').should('eq', '/entrar')
  })

  it('não deixa nenhum link do rodapé sem destino', () => {
    cy.get('footer').contains('a', 'Termos de uso').click()
    cy.location('pathname').should('eq', '/termos-de-uso')

    cy.visit('/')
    cy.get('footer').contains('a', 'Aviso de privacidade').click()
    cy.location('pathname').should('eq', '/aviso-de-privacidade')
  })

  it('oferece um atalho para pular direto ao conteúdo', () => {
    cy.get('a[href="#conteudo-principal"]').should('exist')
    cy.get('main#conteudo-principal').should('exist')
  })

  it('mostra as duas ações de conta no cabeçalho em telas largas', () => {
    cy.viewport(1280, 900)

    cy.get('header').contains('Entrar').should('be.visible')
    cy.get('header').contains('Registrar-se').should('be.visible')
  })

  it('enxuga o cabeçalho em telas estreitas', () => {
    cy.viewport(360, 800)

    cy.get('header').contains('Entrar').should('be.visible')
    // Em 360 px sobra espaço só para uma ação; o cadastro continua no hero.
    cy.get('header').contains('Registrar-se').should('not.be.visible')
    cy.get('main').contains('a', 'Registrar-se').should('be.visible')
  })
})
