/**
 * Minhas requisições — RF008 / RF009.
 *
 * A lista do titular: só os pedidos dele, prazo em primeiro plano e seleção em
 * lote restrita ao que ainda está em andamento.
 */
import { fromNow, page, titularSummaries } from '../support/fixtures'

/** Serve a lista da conta e aplica o cancelamento que chegar, como a API faria. */
function serveList() {
  const requests = titularSummaries()

  cy.intercept('GET', '/api/me/requests?*', (request) => {
    request.reply({ body: page(requests) })
  }).as('list')

  cy.intercept('POST', '/api/me/requests/cancel', (request) => {
    const { ids } = request.body as { ids: string[]; reason: string }
    const cancelled = requests
      .filter((item) => ids.includes(item.id as string) && item.status === 'OPEN')
      .map((item) => {
        Object.assign(item, { status: 'CANCELLED', closedAt: fromNow(0), deadlineStatus: 'CLOSED' })
        return {
          id: item.id,
          protocolNumber: item.protocolNumber,
          status: 'CANCELLED',
          closedAt: item.closedAt,
          dueAt: item.dueAt,
          onTime: true,
        }
      })
    request.reply({ body: { cancelled, rejected: [] } })
  }).as('cancel')
}

describe('Minhas requisições', () => {
  beforeEach(() => {
    cy.viewport(1440, 900)
    cy.signIn('titular')
    serveList()
    cy.visit('/requisicoes')
  })

  it('abre no portal do titular, com a faixa de indicadores', () => {
    cy.get('header').should('contain.text', 'Portal do titular de dados')
    cy.get('h1').should('contain.text', 'Minhas requisições')
    cy.contains('em andamento').should('be.visible')
    cy.contains('com prazo vencido').should('be.visible')
    cy.contains('encerradas').should('be.visible')
  })

  it('lista as requisições da conta, com a vencida no topo', () => {
    cy.get('tbody tr').should('have.length', 5)
    cy.get('tbody tr').first().should('contain.text', '2026-000418')
    cy.get('tbody tr').first().should('contain.text', 'Venceu há 2 dias')
  })

  it('não expõe os códigos do documento de requisitos na tela', () => {
    cy.get('main').invoke('text').should('not.match', /\b(RF|RN)\d{3}\b/)
  })

  it('seleciona requisições em andamento e mostra a barra de ações', () => {
    cy.get('tbody tr').eq(0).find('input[type="checkbox"]').click()
    cy.get('tbody tr').eq(1).find('input[type="checkbox"]').click()

    cy.get('tbody tr').eq(0).find('input[type="checkbox"]').should('be.checked')
    cy.get('tbody tr').eq(1).find('input[type="checkbox"]').should('be.checked')

    cy.contains('2 requisições selecionadas').should('be.visible')
    cy.contains('button', 'Acessar em abas').should('be.visible')

    cy.contains('button', 'Limpar seleção').click()
    cy.contains('requisições selecionadas').should('not.exist')
  })

  it('não deixa selecionar uma requisição encerrada', () => {
    cy.contains('tbody tr', '2026-000392').find('input[type="checkbox"]').should('be.disabled')
    cy.contains('tbody tr', '2026-000377').find('input[type="checkbox"]').should('be.disabled')
  })

  it('cancela as selecionadas com um motivo único', () => {
    cy.get('tbody tr').eq(0).find('input[type="checkbox"]').click()
    cy.get('tbody tr').eq(1).find('input[type="checkbox"]').click()
    cy.contains('button', 'Cancelar selecionadas').click()

    cy.get('[role="dialog"]').within(() => {
      cy.contains('Cancelar 2 requisições?').should('be.visible')
      cy.contains('button', 'Confirmar cancelamento das 2').click()
      cy.contains('Escreva pelo menos 10 caracteres.').should('be.visible')

      cy.get('textarea').type('Consegui os documentos direto na unidade Centro.')
      cy.get('input[type="checkbox"]').check()
      cy.contains('button', 'Confirmar cancelamento das 2').click()
    })

    cy.wait('@cancel')
      .its('request.body')
      .should('deep.include', { reason: 'Consegui os documentos direto na unidade Centro.' })
    cy.get('[role="dialog"]').should('not.exist')
    cy.contains('2 requisições canceladas').should('be.visible')
    cy.contains('tbody tr', '2026-000418').should('contain.text', 'Cancelada')
    cy.contains('tbody tr', '2026-000418').find('input[type="checkbox"]').should('be.disabled')
  })

  it('cancela uma requisição pela própria linha e deixa manter', () => {
    cy.contains('tbody tr', '2026-000447').contains('button', 'Cancelar').click()

    cy.get('[role="dialog"]').within(() => {
      cy.contains('Cancelamento individual').should('be.visible')
      cy.contains('Cancelar a requisição 2026-000447?').should('be.visible')
      cy.contains('button', 'Manter requisição').click()
    })

    cy.get('[role="dialog"]').should('not.exist')
    cy.contains('tbody tr', '2026-000447').should('contain.text', 'Em aberto')
  })

  it('troca a tabela por cartões no celular', () => {
    cy.viewport(360, 780)
    cy.visit('/requisicoes')

    cy.get('table').should('not.be.visible')
    cy.contains('Selecionar várias').should('be.visible')
    cy.get('main ul li').first().should('contain.text', '2026-000418')
  })

  it('avisa a conta pendente de confirmação e não deixa registrar', () => {
    cy.signIn('titular', { emailVerified: false })
    cy.visit('/requisicoes')

    cy.contains('Sua conta está pendente de confirmação de e-mail').should('be.visible')
  })
})
