/**
 * Detalhe da requisição, visão do encarregado — RF005 / RF006 / RF007 / RF012 /
 * RF013 / RF014.
 *
 * A mesma página do titular com finalizar atendimento no lugar de cancelar.
 */
import { REQUEST_IDS, serveRequests } from '../support/requestServer'

/** A URL leva o identificador; o protocolo é o que aparece na tela. */
const ELIMINACAO = `/painel/requisicoes/${REQUEST_IDS.eliminacao}`
const PORTABILIDADE = `/painel/requisicoes/${REQUEST_IDS.portabilidade}`

const ANSWER =
  'Eliminamos seus dados de contato das bases de comunicação e marketing da rede. Os registros clínicos foram mantidos porque a guarda do prontuário é obrigação legal.'

/** O painel de finalização: a página tem outro formulário, o da conversa. */
function answerPanel() {
  return cy.contains('h2', 'Finalizar atendimento').parents('section').first()
}

/** A conversa da requisição, com o campo de envio. */
function thread() {
  return cy.contains('h2', 'Mensagens').parents('section').first()
}

/** O resultado do atendimento, anexado como o seletor de arquivos faria. */
const RESULT = {
  contents: Cypress.Buffer.from('%PDF-1.4 comprovante'),
  fileName: 'comprovante-eliminacao.pdf',
  mimeType: 'application/pdf',
}

function timeline() {
  return cy.contains('h2', 'Histórico e auditoria').parents('section').first().find('ol li')
}

describe('Detalhe da requisição', () => {
  beforeEach(() => {
    cy.viewport(1440, 900)
    cy.signIn('encarregado')
    serveRequests('encarregado')
    cy.visit(ELIMINACAO)
  })

  it('abre o pedido, os anexos, o titular e o prazo legal em destaque', () => {
    cy.get('h1').should('contain.text', 'Anonimização, bloqueio ou eliminação')
    cy.contains('Protocolo 2026-000418').should('be.visible')
    cy.contains('Solicito a eliminação dos meus dados de contato').should('be.visible')
    cy.contains('documento-identidade.pdf').should('be.visible')
    cy.contains('Marina Torres de Almeida').should('be.visible')
    cy.contains('h2', 'Prazo legal')
      .should('be.visible')
      .parent()
      .should('contain.text', 'Venceu há 2 dias')
    cy.contains('Requisição fora do prazo legal').should('be.visible')
  })

  it('mostra o histórico do mais recente ao registro', () => {
    timeline().should('have.length.at.least', 2)
    timeline().last().should('contain.text', 'Requisição registrada')
  })

  it('não expõe os códigos do documento de requisitos na tela', () => {
    cy.get('main').invoke('text').should('not.match', /\bRF\d{3}\b/)
  })

  it('não oferece cancelar — cancelar é ato do titular', () => {
    cy.get('main').should('not.contain.text', 'Cancelar requisição')
    cy.contains('O encarregado não cancela nem apaga requisições').should('be.visible')
  })

  it('finaliza o atendimento com o parecer e o resultado, e tira as ações da tela', () => {
    cy.contains('button', 'Finalizar atendimento').click()

    answerPanel().within(() => {
      cy.get('textarea').type(ANSWER)
      cy.get('input[type="checkbox"]').check()
      cy.contains('button', 'Finalizar atendimento').click()
      cy.contains('Anexe pelo menos um arquivo com o resultado do atendimento.').should('be.visible')

      cy.get('input[type="file"]').selectFile(RESULT, { force: true })
      cy.contains('button', 'Finalizar atendimento').click()
    })

    cy.wait('@complete').its('request.body').should('include', 'comprovante-eliminacao.pdf')
    cy.contains('Atendimento finalizado').should('be.visible')
    cy.contains('Resposta enviada ao titular').should('be.visible')
    cy.contains('Concluída').should('be.visible')
    cy.contains('Não há mais ação de finalizar').should('be.visible')
    cy.get('main').contains('button', 'Pedir complemento').should('not.exist')

    timeline().first().should('contain.text', 'Atendimento finalizado')
    thread().should('contain.text', 'Parecer final')
    thread().should('contain.text', 'não recebe novas mensagens')
    thread().find('form').should('not.exist')
  })

  it('pede complemento pela conversa sem encerrar o atendimento', () => {
    cy.contains('button', 'Pedir complemento').click()

    thread().within(() => {
      cy.focused().should('match', 'textarea')
      cy.contains('Pedido de complemento ao titular').should('be.visible')
      cy.get('textarea').type('Precisamos de uma foto legível do documento de identidade.')
      cy.contains('button', 'Enviar pedido de complemento').click()
    })

    cy.wait('@sendMessage')
    cy.contains('Complemento solicitado ao titular').should('be.visible')
    thread().should('contain.text', 'Precisamos de uma foto legível do documento de identidade.')
    cy.contains('o prazo legal segue correndo').should('be.visible')
    cy.contains('button', 'Finalizar atendimento').should('be.visible')
  })

  it('abre uma requisição já concluída apenas em leitura', () => {
    cy.visit(PORTABILIDADE)

    cy.contains('Concluída').should('be.visible')
    cy.contains('Resposta enviada ao titular').should('be.visible')
    cy.contains('Não há mais ação de finalizar').should('be.visible')
    cy.get('main').contains('button', 'Finalizar atendimento').should('not.exist')
  })

  it('explica um endereço que não leva a requisição nenhuma', () => {
    cy.visit('/painel/requisicoes/01920000-0000-7000-8000-00000000ffff')

    cy.get('h1').should('contain.text', 'Não encontramos esta requisição')
    cy.contains('a', 'Voltar à fila').should('have.attr', 'href', '/painel/fila')
  })

  it('liga as requisições do mesmo titular', () => {
    cy.contains('Outras requisições deste titular').should('be.visible')
    cy.contains('a', '2026-000392').click()

    cy.location('pathname').should('eq', PORTABILIDADE)
  })
})
