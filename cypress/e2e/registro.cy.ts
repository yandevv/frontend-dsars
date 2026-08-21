/**
 * Cadastro do titular — RF002 / RN002 a RN005.
 *
 * Percorre a tela como quem cria a conta: os critérios de senha conferidos
 * enquanto se digita, a recusa de um envio incompleto, o e-mail já cadastrado
 * e a conta criada à espera da confirmação.
 */
const VALID_PASSWORD = 'SenhaSegura!123'

/** E-mail inédito a cada execução: o cadastro recusa endereços repetidos. */
function freshEmail() {
  return `titular.${Date.now()}@exemplo.com.br`
}

function fillForm(email: string, password = VALID_PASSWORD) {
  cy.get('input[autocomplete="name"]').type('Marina Torres de Almeida')
  cy.get('input[autocomplete="email"]').type(email)
  cy.get('input[placeholder="Mínimo de 12 caracteres"]').type(password)
  cy.get('input[placeholder="Repita a senha"]').type(password)
  cy.get('input[type="checkbox"]').check()
}

describe('Registro de conta', () => {
  beforeEach(() => {
    cy.visit('/registrar')
  })

  it('apresenta a tela e a saída para quem já tem conta', () => {
    cy.get('h1').should('contain.text', 'Criar conta')
    cy.contains('Já tem conta?').should('be.visible')
    cy.contains('a', 'Entrar').should('have.attr', 'href', '/entrar')
  })

  it('mostra os critérios do RN002 desde o início e os marca ao digitar', () => {
    cy.contains('Ao menos 12 caracteres').should('be.visible')
    cy.contains('Uma letra maiúscula').should('be.visible')
    cy.contains('Um caractere especial, como ! ? @ #').should('be.visible')
    cy.contains('Ainda em branco').should('be.visible')

    cy.get('input[placeholder="Mínimo de 12 caracteres"]').type('SenhaLongaDemais')
    cy.contains('Média').should('be.visible')

    cy.get('input[placeholder="Mínimo de 12 caracteres"]').type('!')
    cy.contains('Forte').should('be.visible')
  })

  it('recusa o envio incompleto e aponta cada campo pendente', () => {
    cy.get('input[autocomplete="email"]').type('marina@')
    cy.get('button[type="submit"]').click()

    cy.contains('Ainda não é possível criar a conta').should('be.visible')
    cy.contains('Informe o nome completo, como consta no seu documento.').should('be.visible')
    cy.contains('Um e-mail tem o formato nome@dominio.com.br.').should('be.visible')
    cy.contains('O aceite é obrigatório para criar a conta.').should('be.visible')
    // Nada foi enviado: o formulário continua na tela.
    cy.get('form').should('exist')
  })

  it('avisa em tempo real quando a confirmação de senha diverge', () => {
    cy.get('input[placeholder="Mínimo de 12 caracteres"]').type(VALID_PASSWORD)
    cy.get('input[placeholder="Repita a senha"]').type('OutraSenha!123')
    cy.contains('As duas senhas precisam ser iguais.').should('be.visible')

    cy.get('input[placeholder="Repita a senha"]').clear()
    cy.get('input[placeholder="Repita a senha"]').type(VALID_PASSWORD)
    cy.contains('As senhas coincidem.').should('be.visible')
  })

  it('recusa um e-mail que já tem conta e oferece as duas saídas (RN004)', () => {
    fillForm('titular@exemplo.com.br')
    cy.get('button[type="submit"]').click()

    cy.contains('Já existe uma conta com este e-mail').should('be.visible')
    cy.contains('a', 'Entrar com este e-mail').should('have.attr', 'href').and('include', '/entrar')
    cy.contains('a', 'Esqueci a senha')
      .should('have.attr', 'href')
      .and('include', '/recuperar-acesso')
  })

  it('cria a conta e deixa claro que falta confirmar o e-mail (RN005)', () => {
    const email = freshEmail()
    fillForm(email)
    cy.get('button[type="submit"]').click()

    cy.contains('Conta criada. Falta confirmar o e-mail.').should('be.visible')
    cy.contains(email).should('be.visible')
    cy.contains('O link vale por 24 horas.').should('be.visible')
    cy.get('form').should('not.exist')
  })

  it('leva aos documentos legais citados no aceite', () => {
    cy.contains('a', 'termos de uso').click()
    cy.location('pathname').should('eq', '/termos-de-uso')

    cy.visit('/registrar')
    cy.contains('a', 'aviso de privacidade').click()
    cy.location('pathname').should('eq', '/aviso-de-privacidade')
  })

  it('empilha as colunas e encurta o cabeçalho em tela estreita', () => {
    cy.viewport(360, 800)
    cy.visit('/registrar')

    cy.contains('Instituto Meridiano').should('be.visible')
    cy.contains('Atendimento a requisições de titulares de dados').should('not.be.visible')
    cy.get('h1').should('contain.text', 'Criar conta')
    cy.contains('O que acontece depois').should('exist')
  })
})
