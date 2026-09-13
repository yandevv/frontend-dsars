/**
 * Registrar requisição em nome do titular — RF004 (variante) / RN018.
 *
 * O pedido chegou por outro canal: a encarregada identifica o titular, informa
 * canal e data de recebimento e registra. O prazo conta do recebimento.
 */
function isoDaysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

const DESCRIPTION =
  'Carta assinada pedindo a exclusão dos dados usados em campanhas. Identidade conferida pela cópia do RG anexada.'

describe('Registrar em nome do titular', () => {
  it('parte da fila e registra um pedido de carta antiga, que já nasce vencido', () => {
    cy.viewport(1440, 900)
    cy.visit('/painel/fila')
    cy.contains('a', 'Registrar em nome do titular').click()

    cy.location('pathname').should('eq', '/painel/requisicoes/nova')
    cy.get('h1').should('contain.text', 'Registrar requisição em nome do titular')

    cy.contains('button', 'Registrar requisição').click()
    cy.contains('Revise os campos marcados para registrar').should('be.visible')

    cy.get('input[placeholder="CPF, e-mail ou nome"]').type('marina')
    cy.contains('li', 'Marina Torres de Almeida').contains('button', 'Selecionar').click()
    cy.contains('button', 'Selecionado').should('have.attr', 'aria-pressed', 'true')
    cy.contains('label', 'Confirmo que verifiquei a identidade').click()

    cy.contains('label', 'Carta').click()
    cy.get('input[type="date"]').clear()
    cy.get('input[type="date"]').type(isoDaysAgo(20))
    cy.get('aside').should('contain.text', 'já nasce fora do prazo legal')
    cy.get('input[placeholder^="Ex.: atendimento"]').type('Carta nº 219/2026')

    cy.contains('label', 'Eliminação').click()
    cy.get('textarea').type(DESCRIPTION)
    cy.contains('button', 'Registrar requisição').click()

    cy.contains('Requisição registrada').should('be.visible')
    cy.get('h1').should('contain.text', 'criado em nome de Marina Torres de Almeida')
    cy.contains('Carta · Carta nº 219/2026').should('be.visible')
    cy.contains('A requisição já aparece na lista do titular').should('be.visible')

    cy.contains('a', 'Abrir a requisição').click()
    cy.location('pathname').should('match', /^\/painel\/requisicoes\/[0-9a-f-]{36}$/)
    cy.contains('Canal de origem').should('be.visible')
    cy.contains('registrado por Helena Prado Vasconcelos').should('be.visible')
    cy.contains('h2', 'Prazo legal').parent().should('contain.text', 'Venceu há 5 dias')
    cy.contains('Requisição registrada em nome do titular').should('be.visible')
  })

  it('não aceita recebimento depois de hoje', () => {
    cy.viewport(1440, 900)
    cy.visit('/painel/requisicoes/nova')

    cy.get('input[type="date"]').should('have.attr', 'max', isoDaysAgo(0))
    cy.get('input[type="date"]').clear()
    cy.get('input[type="date"]').type(isoDaysAgo(-2))
    cy.contains('button', 'Registrar requisição').click()
    cy.contains('Informe uma data de hoje ou anterior.').should('be.visible')
  })

  it('no celular vira três passos, cada um conferido antes de seguir', () => {
    cy.viewport(360, 780)
    cy.visit('/painel/requisicoes/nova')

    cy.contains('Passo 1 de 3 · Titular').should('be.visible')
    cy.contains('2. Origem do pedido').should('not.be.visible')

    cy.contains('button', 'Continuar para a origem').click()
    cy.contains('Selecione o titular do pedido para registrar.').should('be.visible')

    cy.contains('label', 'Titular sem cadastro').click()
    cy.contains('label', 'Nome completo').parent().parent().find('input').type('Wagner Sipriano Melo')
    cy.contains('label', 'CPF').parent().parent().find('input').type('318.902.774-10')
    cy.contains('Sem e-mail, a resposta sai por carta').should('be.visible')
    cy.contains('label', 'Confirmo que verifiquei a identidade').click()
    cy.contains('button', 'Continuar para a origem').click()

    cy.contains('Passo 2 de 3 · Origem').should('be.visible')
    cy.contains('label', 'Balcão').click()
    cy.contains('button', 'Continuar para o pedido').click()

    cy.contains('Passo 3 de 3 · Pedido').should('be.visible')
    cy.contains('label', 'Acesso').click()
    cy.contains('label', 'Declaração completa').click()
    cy.get('textarea').type(DESCRIPTION)
    cy.contains('button', 'Registrar requisição').click()

    cy.get('h1').should('contain.text', 'criado em nome de Wagner Sipriano Melo')
    cy.contains('O titular não tem conta no portal').should('be.visible')
    cy.document().its('documentElement.scrollWidth').should('be.lte', 360)
  })
})
