// Carregado antes de cada arquivo de teste.
import './commands'

// Nenhum teste fala com o backend de verdade: toda chamada a `/api` que o
// teste não simular recebe a resposta-padrão — sem sessão, sem avisos.
beforeEach(() => {
  cy.mockApiDefaults()
})
