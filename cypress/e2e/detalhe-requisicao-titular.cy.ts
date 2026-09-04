/**
 * Detalhe da requisição, visão do titular — RF005 / RF010.
 *
 * A mesma requisição do encarregado, sem o trabalho interno da equipe e com
 * cancelar no lugar de finalizar.
 */
const ELIMINACAO = "/requisicoes/01a01f0a-da00-7d89-9fae-9ed1e70505ae";
const PORTABILIDADE = "/requisicoes/01a07bbe-0b9a-7632-97a6-76d3d14bcea8";
const DE_OUTRA_PESSOA = "/requisicoes/01a02e7e-0cef-75a5-9b71-9d773cb4842f";

describe("Detalhe da requisição (titular)", () => {
  beforeEach(() => {
    cy.viewport(1440, 900);
  });

  it("chega pela lista e mostra pedido, prazo e identificação", () => {
    cy.visit("/requisicoes");
    cy.contains("tbody tr", "2026-000418").contains("a", "Abrir").click();

    cy.location("pathname").should("eq", ELIMINACAO);
    cy.get("h1").should("contain.text", "Eliminação de dados");
    cy.contains("h2", "Seu pedido").should("be.visible");
    cy.contains("h2", "Prazo legal").should("be.visible");
    cy.contains("01a01f0a-da00-7d89-9fae-9ed1e70505ae").should("be.visible");
  });

  it("não mostra o trabalho interno da equipe nem os códigos de requisito", () => {
    cy.visit(ELIMINACAO);

    cy.contains("h2", "Histórico da requisição").should("be.visible");
    cy.get("main").should("not.contain.text", "Nota interna registrada");
    cy.get("main").should("not.contain.text", "Exportar trilha");
    cy.get("main").invoke("text").should("not.match", /\b(RF|RN)\d{3}\b/);
  });

  it("cancela a requisição pela própria página", () => {
    cy.visit(ELIMINACAO);
    cy.contains("button", "Cancelar requisição").click();

    cy.get('[role="dialog"]').within(() => {
      cy.contains("Cancelar a requisição 2026-000418?").should("be.visible");
      cy.get("textarea").type("Resolvi o assunto direto com a unidade Centro.");
      cy.get('input[type="checkbox"]').check();
      cy.contains("button", "Confirmar cancelamento").click();
    });

    cy.contains("Requisição cancelada").should("be.visible");
    cy.contains("button", "Cancelar requisição").should("not.exist");
    cy.contains("Requisição cancelada pelo titular").should("be.visible");
  });

  it("mostra a resposta de uma requisição concluída e deixa baixá-la", () => {
    cy.visit(PORTABILIDADE);

    cy.contains("h2", "Resposta da organização").should("be.visible");
    cy.contains("button", "Baixar a resposta").should("be.visible");
    cy.contains("button", "Cancelar requisição").should("not.exist");
  });

  it("trata a requisição de outra pessoa como inexistente", () => {
    cy.visit(DE_OUTRA_PESSOA);

    cy.get("h1").should("contain.text", "Não encontramos esta requisição");
    cy.contains("a", "Voltar à lista").should("have.attr", "href", "/requisicoes");
  });
});
