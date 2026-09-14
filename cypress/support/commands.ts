/// <reference types="cypress" />
import {
  ENCARREGADO,
  ORGANIZATION,
  TITULAR,
  page,
  problem,
} from './fixtures'

type Role = 'titular' | 'encarregado'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /** Respostas-padrão da API: organização, sem sessão e caixa de avisos vazia. */
      mockApiDefaults(): Chainable<void>
      /** Abre a sessão do perfil pedido: `GET /api/me` passa a devolver a conta. */
      signIn(role: Role, overrides?: Record<string, unknown>): Chainable<void>
    }
  }
}

Cypress.Commands.add('mockApiDefaults', () => {
  // Registrada primeiro, é a de menor prioridade: nenhuma chamada escapa para
  // um backend que esteja rodando na máquina.
  cy.intercept({ url: '/api/**' }, problem(404, 'Rota não simulada neste teste.'))
  cy.intercept('GET', '/api/public/organizations/*', { body: ORGANIZATION })
  cy.intercept('GET', '/api/me', problem(401, 'É necessário estar autenticado.'))
  cy.intercept('POST', '/api/auth/refresh', problem(401, 'É necessário estar autenticado.'))
  cy.intercept('POST', '/api/auth/logout', { statusCode: 204 })
  cy.intercept('GET', '/api/me/notifications?*', { body: page([]) })
  cy.intercept('GET', '/api/me/notifications/unread-count', { body: { unreadCount: 0 } })
})

Cypress.Commands.add('signIn', (role: Role, overrides: Record<string, unknown> = {}) => {
  const account = { ...(role === 'titular' ? TITULAR : ENCARREGADO), ...overrides }
  cy.intercept('GET', '/api/me', { body: account }).as('me')
})

export {}
