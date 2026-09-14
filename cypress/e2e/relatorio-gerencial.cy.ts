/**
 * Relatório gerencial — RF028.
 *
 * Os números que o encarregado leva à diretoria e à autoridade, apurados pelo
 * servidor, e a regra que impede o relatório de apontar para quem respondeu
 * a pesquisa de satisfação.
 */
import { ORG_ID, fromNow } from '../support/fixtures'

/** A apuração muda conforme o recorte pedido na query, como no servidor. */
function report(query: URLSearchParams) {
  const narrow = query.getAll('right').includes('CONSENT_REVOCATION')
  const cancelled = query.getAll('status').includes('CANCELLED')
  const thisYear = (query.get('from') ?? '').endsWith('-01-01')
  const total = narrow ? (cancelled ? 0 : 2) : thisYear ? 120 : 35

  return {
    organizationId: ORG_ID,
    period: { from: query.get('from'), to: query.get('to') },
    filters: { status: null, right: null },
    generatedAt: fromNow(0),
    total,
    totalsByStatus: narrow
      ? { OPEN: 0, COMPLETED: cancelled ? 0 : 2, CANCELLED: 0 }
      : { OPEN: 8, COMPLETED: total - 11, CANCELLED: 3 },
    totalsByRight: narrow
      ? { CONSENT_REVOCATION: total }
      : { DATA_ACCESS: 12, CONSENTED_DATA_DELETION: total - 20, DATA_CORRECTION: 8 },
    averageResolutionHours: total === 0 ? null : 180,
    deadline: {
      closed: narrow ? total : total - 11,
      closedOnTime: narrow ? total : total - 13,
      onTimePercentage: total === 0 ? null : 91.7,
      openOverdue: narrow ? 0 : 2,
    },
    satisfaction: narrow
      ? { responses: total, suppressed: true, averageRating: null, distribution: null }
      : {
          responses: 14,
          suppressed: false,
          averageRating: 4.4,
          distribution: { '1': 0, '2': 1, '3': 1, '4': 3, '5': 9 },
        },
  }
}

describe('Relatório gerencial', () => {
  beforeEach(() => {
    cy.viewport(1440, 900)
    cy.signIn('encarregado')
    cy.intercept('GET', '/api/organizations/*/reports/requests?*', (request) => {
      request.reply({ body: report(new URL(request.url).searchParams) })
    }).as('report')
    cy.visit('/painel/relatorios')
  })

  it('abre com os quatro indicadores do período padrão', () => {
    cy.get('h1').should('contain.text', 'Relatório gerencial')
    cy.contains('Requisições no período').should('be.visible')
    cy.contains('Tempo médio de atendimento').should('be.visible')
    cy.contains('Concluídas dentro do prazo').should('be.visible')
    cy.contains('Satisfação média').should('be.visible')
    cy.contains('últimos 90 dias').should('be.visible')
  })

  it('não expõe os códigos do documento de requisitos na tela', () => {
    cy.get('main').invoke('text').should('not.match', /\bRF\d{3}\b/)
  })

  it('não mostra nada que identifique um titular', () => {
    cy.get('main').should('not.contain.text', 'Marina Torres')
    cy.get('main').should('not.contain.text', '@exemplo.com.br')
    cy.contains('nenhum indicador desta tela identifica titular ou respondente').should('be.visible')
  })

  it('compõe os totais por direito e por estado', () => {
    cy.contains('Total por direito exercido').should('be.visible')
    cy.contains('Total por estado').should('be.visible')
    cy.contains('concluídas fora do prazo legal').should('be.visible')
  })

  it('pede uma nova apuração quando o recorte muda', () => {
    cy.contains('35 requisições').should('be.visible')

    cy.get('select').first().select('este-ano')

    cy.wait('@report')
    cy.contains('120 requisições').should('be.visible')
    cy.contains('este ano').should('be.visible')
  })

  it('oculta a satisfação quando o servidor a suprime', () => {
    cy.get('select').first().select('mes-anterior')
    cy.get('select').eq(1).select('IX')

    cy.contains('Resultados ocultos para preservar o anonimato').should('be.visible')
    cy.contains('Nota média').should('not.exist')
  })

  it('explica um recorte sem nenhum registro', () => {
    cy.get('select').first().select('mes-anterior')
    cy.get('select').eq(1).select('IX')
    cy.get('select').eq(2).select('cancelada')

    cy.contains('Nenhuma requisição nesse recorte').should('be.visible')
    cy.get('main').contains('button', 'Limpar filtros').click()
    cy.contains('Requisições no período').should('be.visible')
  })

  it('abre o período personalizado com as duas datas', () => {
    cy.get('select').first().select('personalizado')

    cy.get('input[type="date"]').should('have.length', 2)
    cy.contains('label', 'De').should('be.visible')
    cy.contains('label', 'Até').should('be.visible')
  })

  it('oferece os dois formatos de exportação, gerados pelo servidor', () => {
    cy.intercept('GET', '/api/organizations/*/reports/requests/export?*', {
      body: 'Indicador;Valor',
      headers: {
        'content-type': 'text/csv',
        'content-disposition': 'attachment; filename="relatorio-requisicoes.csv"',
      },
    }).as('export')
    cy.contains('button', 'Exportar relatório').click()

    cy.contains('Planilha CSV').should('be.visible')
    cy.contains('Relatório em PDF').should('be.visible')
    cy.contains('últimos 90 dias · todos os direitos · todos os estados').should('be.visible')

    cy.contains('Planilha CSV').click()
    cy.wait('@export').its('request.url').should('include', 'format=csv')
  })
})
