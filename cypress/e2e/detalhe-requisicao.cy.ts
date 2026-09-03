/**
 * Detalhe da requisição, visão do encarregado — RF005 / RF006 / RF007 / RF012 /
 * RF013 / RF014.
 *
 * A mesma página do titular com finalizar atendimento no lugar de cancelar.
 */
/** A URL leva o identificador; o protocolo é o que aparece na tela. */
const ELIMINACAO = '/painel/requisicoes/01a01f0a-da00-7d89-9fae-9ed1e70505ae'
const PORTABILIDADE = '/painel/requisicoes/01a07bbe-0b9a-7632-97a6-76d3d14bcea8'

const ANSWER =
  'Eliminamos seus dados de contato das bases de comunicação e marketing da rede, incluindo telefone e e-mail promocional. Os registros clínicos foram mantidos porque a guarda do prontuário é obrigação legal.'

/** O histórico: a primeira <ol> da página é a trilha do "você está em". */
function timeline() {
  return cy.contains('h2', 'Histórico e auditoria').parents('section').first().find('ol li')
}

describe('Detalhe da requisição', () => {
  beforeEach(() => {
    cy.viewport(1440, 900)
    cy.visit(ELIMINACAO)
  })

  it('abre o pedido, os anexos e o prazo legal em destaque', () => {
    cy.get('h1').should('contain.text', 'Eliminação de dados')
    cy.contains('Protocolo 2026-000418').should('be.visible')
    cy.contains('Solicito a eliminação dos meus dados de contato').should('be.visible')
    cy.contains('documento-identidade.pdf').should('be.visible')
    // O cartão de prazo, não o resumo que só aparece no cabeçalho do celular.
    cy.contains('h2', 'Prazo legal')
      .should('be.visible')
      .parent()
      .should('contain.text', 'Venceu há 2 dias')
    cy.contains('Requisição fora do prazo legal').should('be.visible')
  })

  it('mostra o histórico do mais recente ao registro', () => {
    cy.contains('Histórico e auditoria').should('be.visible')
    timeline().should('have.length.at.least', 6)
    timeline().first().should('contain.text', 'Nota interna registrada')
    timeline().last().should('contain.text', 'Requisição registrada')
    cy.contains('Notas internas').should('be.visible')
    cy.contains('não são visíveis ao titular').should('be.visible')
  })

  it('não expõe os códigos do documento de requisitos na tela', () => {
    // Os RFxxx organizam o TCC, não o atendimento: quem usa o sistema não tem
    // por que ler a numeração de um documento que nunca vai abrir.
    cy.get('main').invoke('text').should('not.match', /\bRF\d{3}\b/)
  })

  it('não oferece cancelar nem excluir — cancelar é ato do titular (RF010)', () => {
    cy.get('main').should('not.contain.text', 'Cancelar requisição')
    cy.get('main').should('not.contain.text', 'Excluir')
    cy.contains('O encarregado não cancela nem apaga requisições').should('be.visible')
  })

  it('exige fundamento legal para recusar o pedido', () => {
    cy.contains('button', 'Finalizar atendimento').click()
    cy.contains('Resposta ao titular').should('be.visible')

    cy.get('input[value="recusado"]').check()
    cy.contains('Justificativa ao titular').should('be.visible')
    cy.get('form textarea').type(ANSWER)
    cy.get('form input[type="checkbox"]').check()
    cy.get('form').contains('button', 'Finalizar atendimento').click()

    cy.contains('Campo obrigatório para o desfecho recusado.').should('be.visible')
    cy.contains('Resposta enviada ao titular').should('not.exist')
  })

  it('finaliza o atendimento, publica a resposta e tira as ações da tela', () => {
    cy.contains('button', 'Finalizar atendimento').click()

    cy.get('input[value="parcialmente-atendido"]').check()
    cy.get('form textarea').type(ANSWER)
    cy.get('form input[type="checkbox"]').check()
    cy.get('form').contains('button', 'Finalizar atendimento').click()

    cy.contains('Atendimento finalizado').should('be.visible')
    cy.contains('Resposta enviada ao titular').should('be.visible')
    cy.contains('Parcialmente atendido').should('be.visible')
    cy.contains('Concluída').should('be.visible')
    cy.contains('Não há mais ação de finalizar').should('be.visible')
    cy.get('main').contains('button', 'Pedir complemento').should('not.exist')

    timeline().first().should('contain.text', 'Atendimento finalizado')
  })

  it('pede complemento sem encerrar o atendimento — o prazo não para', () => {
    cy.contains('button', 'Pedir complemento').click()

    cy.contains('Complemento solicitado ao titular').should('be.visible')
    cy.contains('o prazo legal segue correndo').should('be.visible')
    cy.contains('Aguardando complemento').should('be.visible')
    cy.contains('button', 'Finalizar atendimento').should('be.visible')
  })

  it('abre uma requisição já concluída apenas em leitura', () => {
    cy.visit(PORTABILIDADE)

    cy.contains('Concluída').should('be.visible')
    cy.contains('Resposta enviada ao titular').should('be.visible')
    cy.contains('Não há mais ação de finalizar').should('be.visible')
    cy.get('main').contains('button', 'Finalizar atendimento').should('not.exist')
  })

  it('explica um endereço que não leva a requisição nenhuma em vez de mostrar página vazia', () => {
    cy.visit('/painel/requisicoes/01a00000-0000-7000-8000-000000000000')

    cy.get('h1').should('contain.text', 'Não encontramos esta requisição')
    cy.contains('a', 'Voltar à fila').should('have.attr', 'href', '/painel/fila')
  })

  it('liga as requisições do mesmo titular', () => {
    cy.contains('Outras requisições deste titular').should('be.visible')
    cy.contains('a', '2026-000392').click()

    cy.location('pathname').should('eq', PORTABILIDADE)
  })
})
