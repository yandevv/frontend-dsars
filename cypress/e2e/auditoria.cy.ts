/**
 * Registros de auditoria — trilha imutável (RN083 a RN085).
 *
 * Só leitura: filtrar, abrir a requisição a que o registro se refere e
 * exportar. A API ainda não oferece a consulta da trilha; a tela a aproxima
 * com o registro e o encerramento das requisições da organização.
 */
import { page, queueSummaries } from '../support/fixtures'

describe('Registros de auditoria', () => {
  beforeEach(() => {
    cy.viewport(1440, 900)
    cy.signIn('encarregado')
    cy.intercept('GET', '/api/organizations/*/requests?*', { body: page(queueSummaries()) })
    cy.visit('/painel/auditoria?periodo=todos')
  })

  it('lista o registro e o encerramento das requisições', () => {
    cy.get('h1').should('contain.text', 'Registros de auditoria')
    cy.contains('não podem ser editados nem excluídos').should('be.visible')
    // Oito registros e dois encerramentos — a concluída e a cancelada.
    cy.get('tbody tr').should('have.length', 10)
    cy.contains('td', 'Requisição registrada').should('be.visible')
    cy.contains('td', 'Atendimento finalizado').should('be.visible')
    cy.get('main').invoke('text').should('not.match', /\bRN\d{3}\b/)
  })

  it('filtra por operação e registra o recorte no endereço', () => {
    cy.contains('label', 'Operação').parent().find('select').select('Mudança de estado')

    cy.location('search').should('contain', 'operacao=transicao')
    cy.get('tbody tr').should('have.length', 2)
  })

  it('mostra o estado vazio quando o recorte não traz nada', () => {
    cy.get('input[type="search"]').type('protocolo-que-nao-existe')

    cy.contains('Nenhum registro neste recorte').should('be.visible')
    cy.contains('button', 'Limpar filtros').first().click()
    cy.get('tbody tr').should('have.length.greaterThan', 0)
  })

  it('abre a requisição pelo protocolo do registro', () => {
    cy.get('input[type="search"]').type('2026-000392')
    cy.get('tbody tr').first().find('a').click()

    cy.location('pathname').should('match', /^\/painel\/requisicoes\/[0-9a-f-]{36}$/)
  })

  it('registra a exportação na própria trilha', () => {
    cy.contains('button', 'Exportar CSV').click()

    cy.contains('A exportação foi registrada na própria trilha').should('be.visible')
    cy.get('tbody tr').first().should('contain.text', 'Trilha de auditoria exportada')
  })

  it('vira cartões no celular, sem rolagem lateral', () => {
    cy.viewport(360, 780)

    cy.get('table').should('not.be.visible')
    cy.contains('li', 'Requisição registrada').should('be.visible')
    cy.document().its('documentElement.scrollWidth').should('be.lte', 360)
  })
})
