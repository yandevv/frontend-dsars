/**
 * Configurações e dados pessoais — RF015 a RF017.
 *
 * O hub com as três seções, a identificação mascarada que se revela por meio
 * minuto, a edição confirmada e a troca de e-mail que fica pendente.
 */
describe('Configurações', () => {
  beforeEach(() => {
    cy.viewport(1440, 900)
  })

  it('o hub apresenta as três seções e leva a cada uma', () => {
    cy.visit('/configuracoes')

    cy.get('h1').should('contain.text', 'Configurações')
    cy.contains('h2', 'Dados pessoais').should('be.visible')
    cy.contains('h2', 'Segurança').should('be.visible')
    cy.contains('h2', 'Notificações').should('be.visible')
    cy.get('main').contains('a', 'Abrir dados pessoais').click()
    cy.location('pathname').should('eq', '/configuracoes/dados-pessoais')
  })

  it('"Meus dados" do cabeçalho leva aos dados pessoais', () => {
    cy.visit('/requisicoes')
    cy.get('header').contains('a', 'Meus dados').click()
    cy.location('pathname').should('eq', '/configuracoes/dados-pessoais')
  })

  it('mostra o documento mascarado e revela só por ação explícita', () => {
    cy.clock()
    cy.visit('/configuracoes/dados-pessoais')
    // O relógio é falso: a espera simulada da rede só passa com o tique, e ele
    // só vale depois que a página já pediu os dados.
    cy.get('h1').should('contain.text', 'Dados pessoais')
    cy.tick(1000)

    cy.contains('•••.•••.789-••').should('be.visible')
    cy.get('main').should('not.contain.text', '476.201.789-04')
    cy.contains('dl > div', 'Documento de identificação').contains('button', 'Revelar').click()
    cy.contains('476.201.789-04').should('be.visible')

    cy.tick(30_000)
    cy.get('main').should('not.contain.text', '476.201.789-04')
  })

  it('edita o telefone depois de confirmar', () => {
    cy.visit('/configuracoes/dados-pessoais')

    cy.contains('dl > div', 'Telefone').contains('button', 'Editar').click()
    cy.contains('dl > div', 'Telefone').find('input').clear()
    cy.contains('dl > div', 'Telefone').find('input').type('16981102233')
    cy.contains('dl > div', 'Telefone').contains('button', 'Salvar').click()

    cy.get('[role="dialog"]').within(() => {
      cy.contains('Confirmar alteração do telefone').should('be.visible')
      cy.contains('(16) 99482-3071').should('be.visible')
      cy.contains('button', 'Salvar alteração').click()
    })
    cy.contains('Telefone atualizado.').should('be.visible')
    cy.contains('dl > div', 'Telefone').should('contain.text', '-2233')
  })

  it('a troca de e-mail fica pendente até a confirmação e pode ser cancelada', () => {
    cy.visit('/configuracoes/dados-pessoais')

    cy.contains('dl > div', 'E-mail').contains('button', 'Editar').click()
    cy.contains('dl > div', 'E-mail').find('input').type('marina.nova@exemplo.com.br')
    cy.contains('dl > div', 'E-mail').contains('button', 'Salvar').click()
    cy.get('[role="dialog"]').within(() => {
      cy.get('input[type="password"]').type('SenhaSegura!123')
      cy.contains('button', 'Enviar confirmação').click()
    })

    cy.contains('Confirme o novo e-mail para concluir a troca').should('be.visible')
    cy.contains('dl > div', 'E-mail').should('contain.text', 'Troca pendente')
    cy.contains('dl > div', 'E-mail').should('contain.text', 'titular@exemplo.com.br')

    cy.contains('button', 'Cancelar troca').click()
    cy.contains('Troca de e-mail cancelada.').should('be.visible')
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
