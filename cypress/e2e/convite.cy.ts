/**
 * Convite de encarregado — variante do quadro 1c de `Registro de Conta.dc.html`.
 *
 * Percorre a tela como quem recebeu o link por e-mail: o vínculo antes do
 * aceite, o aceite com a conta do endereço convidado, e os três links que não
 * levam a lugar nenhum — vencido, já aceito e inexistente.
 */
import { ENCARREGADO, ORG_ID, TITULAR, page, problem } from '../support/fixtures'

const INVITED = 'bruno.carvalho@meridianosaude.org.br'

function preview(status: string) {
  return {
    body: {
      organizationName: 'Instituto Meridiano de Saúde',
      email: INVITED,
      role: 'DPO',
      expiresAt: '2026-10-03T12:00:00.000Z',
      status,
    },
  }
}

describe('Convite de encarregado', () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/invites/convite-valido', preview('PENDING'))
    cy.intercept('GET', '/api/invites/convite-expirado', preview('EXPIRED'))
    cy.intercept('GET', '/api/invites/convite-usado', preview('ACCEPTED'))
    cy.intercept('GET', '/api/invites/isto-nao-existe', problem(404, 'Este convite não existe.'))
  })

  it('mostra o vínculo que está sendo aceito', () => {
    cy.visit('/convites/convite-valido')

    cy.get('h1').should('contain.text', 'Aceitar o convite')
    cy.contains('Vínculo que você está aceitando').should('be.visible')
    cy.get('main').contains('Instituto Meridiano de Saúde').should('be.visible')
    cy.contains('Encarregado de proteção de dados').should('be.visible')
    cy.contains(INVITED).should('be.visible')
  })

  it('sem sessão, leva ao acesso e volta ao convite', () => {
    cy.visit('/convites/convite-valido')

    cy.contains('a', 'Entrar para aceitar')
      .should('have.attr', 'href')
      .and('include', 'redirect=/convites/convite-valido')
    cy.contains('a', 'Criar conta com este e-mail').should('have.attr', 'href', '/registrar')
  })

  it('aceita o convite com a conta convidada e leva ao painel', () => {
    cy.signIn('titular', { email: INVITED, fullName: 'Bruno Carvalho de Souza' })
    cy.intercept('POST', '/api/invites/convite-valido/accept', {
      body: { organizationId: ORG_ID, organizationName: 'Instituto Meridiano de Saúde', role: 'DPO' },
    }).as('accept')
    cy.intercept('GET', '/api/organizations/*/requests?*', { body: page([]) })
    cy.visit('/convites/convite-valido')

    // Aceito, o perfil relido passa a ter o vínculo com a organização.
    cy.intercept('GET', '/api/me', {
      body: { ...ENCARREGADO, email: INVITED, fullName: 'Bruno Carvalho de Souza' },
    })
    cy.contains('button', 'Aceitar convite').click()

    cy.wait('@accept')
    cy.contains('Vínculo aceito').should('be.visible')
    cy.contains('button', 'Ir para o painel de atendimento').click()
    cy.location('pathname').should('eq', '/painel/fila')
  })

  it('avisa quando a sessão é de outro endereço', () => {
    cy.signIn('titular')
    cy.visit('/convites/convite-valido')

    cy.contains('Você entrou com outra conta').should('be.visible')
    cy.contains(TITULAR.email).should('be.visible')
    cy.contains('button', 'Aceitar convite').should('not.exist')
  })

  it('aceita também o formato antigo do link', () => {
    cy.visit('/convite/convite-valido')

    cy.get('h1').should('contain.text', 'Aceitar o convite')
  })

  it('explica o convite vencido', () => {
    cy.visit('/convites/convite-expirado')

    cy.get('h1').should('contain.text', 'Este convite venceu em')
    cy.contains('Peça um novo a quem enviou').should('be.visible')
  })

  it('manda ao login quem abre um convite já aceito', () => {
    cy.visit('/convites/convite-usado')

    cy.get('h1').should('contain.text', 'Este convite já foi aceito')
    cy.get('main').contains('a', 'Entrar').should('have.attr', 'href').and('include', '/entrar')
  })

  it('não revela nada sobre um convite que não existe', () => {
    cy.visit('/convites/isto-nao-existe')

    cy.get('h1').should('contain.text', 'Não encontramos este convite')
    cy.get('main').should('not.contain.text', 'bruno.carvalho@')
    cy.contains('a', 'Crie uma conta comum').should('have.attr', 'href', '/registrar')
    cy.get('a[href^="mailto:"]').should('have.attr', 'href', 'mailto:dpo@meridianosaude.org.br')
  })
})
