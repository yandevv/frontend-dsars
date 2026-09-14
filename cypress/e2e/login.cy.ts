/**
 * Acesso à conta — RF003 / RN008 a RN010.
 *
 * Percorre a tela como quem tenta entrar: a recusa que não entrega qual campo
 * errou nem se a conta está bloqueada, e o destino conforme o perfil. A
 * contagem de tentativas e o bloqueio são do servidor; a tela repete o que ele
 * responde.
 */
import { ENCARREGADO, TITULAR, page, problem } from '../support/fixtures'

const PASSWORD = 'SenhaSegura!123'
const GENERIC =
  'Não foi possível entrar. Verifique os dados informados ou aguarde alguns minutos antes de tentar novamente.'

function signIn(email: string, password: string) {
  cy.get('input[autocomplete="email"]').clear()
  cy.get('input[autocomplete="email"]').type(email)
  cy.get('input[autocomplete="current-password"]').clear()
  cy.get('input[autocomplete="current-password"]').type(password)
  cy.get('button[type="submit"]').click()
}

/** O servidor aceita a senha certa para as duas contas de demonstração. */
function acceptLogin() {
  cy.intercept('POST', '/api/auth/login', (request) => {
    const { email, password } = request.body as { email: string; password: string }
    const account = [TITULAR, ENCARREGADO].find((item) => item.email === email)
    if (!account || password !== PASSWORD) {
      request.reply(problem(401, GENERIC))
      return
    }
    request.reply({ body: { user: account } })
  }).as('login')
  cy.intercept('GET', '/api/me/requests?*', { body: page([]) })
  cy.intercept('GET', '/api/organizations/*/requests?*', { body: page([]) })
}

describe('Acesso à conta', () => {
  beforeEach(() => {
    acceptLogin()
    cy.visit('/entrar')
  })

  it('apresenta a tela e a saída para quem ainda não tem conta', () => {
    cy.get('h1').should('contain.text', 'Entrar')
    cy.contains('Ainda não tem conta?').should('be.visible')
    cy.contains('a', 'Criar conta').should('have.attr', 'href', '/registrar')
  })

  it('repete a recusa do servidor sem dizer qual campo falhou (RN009)', () => {
    signIn('titular@exemplo.com.br', 'senhaerrada')

    cy.contains('Não foi possível entrar').should('be.visible')
    cy.contains('aguarde alguns minutos').should('be.visible')
    // Marcar um dos campos contaria se aquele e-mail tem conta no portal.
    cy.get('[aria-invalid="true"]').should('not.exist')
  })

  it('não chama o servidor com os campos vazios', () => {
    cy.get('button[type="submit"]').click()

    cy.contains('Informe o e-mail e a senha').should('be.visible')
    cy.get('@login.all').should('have.length', 0)
  })

  it('envia o "manter-me conectado" junto com as credenciais', () => {
    cy.contains('label', 'Manter-me conectado').click()
    signIn('titular@exemplo.com.br', PASSWORD)

    cy.wait('@login').its('request.body').should('deep.include', { rememberMe: true })
  })

  it('leva o titular aos próprios pedidos, sem perguntar o perfil', () => {
    signIn('titular@exemplo.com.br', PASSWORD)

    cy.location('pathname').should('eq', '/requisicoes')
    cy.get('h1').should('contain.text', 'Minhas requisições')
  })

  it('leva a encarregada à fila, e as páginas comuns passam a falar com ela', () => {
    // Largura de computador: o link de ajuda fica à vista no cabeçalho.
    cy.viewport(1440, 900)
    signIn('helena.vasconcelos@meridianosaude.org.br', PASSWORD)

    cy.location('pathname').should('eq', '/painel/fila')
    cy.get('h1').should('contain.text', 'Fila de atendimento')

    cy.get('header').contains('a', 'Ajuda').click()
    cy.contains('h2', 'Registrar em nome do titular').should('be.visible')
  })

  it('volta à tela restrita que pediu o acesso', () => {
    cy.visit('/requisicoes/nova')
    cy.location('pathname').should('eq', '/entrar')

    signIn('titular@exemplo.com.br', PASSWORD)

    cy.location('pathname').should('eq', '/requisicoes/nova')
  })

  it('não volta ao formulário de acesso pelo botão de voltar', () => {
    cy.visit('/')
    cy.get('header').contains('a', 'Entrar').click()
    signIn('titular@exemplo.com.br', PASSWORD)
    cy.location('pathname').should('eq', '/requisicoes')

    cy.go('back')
    cy.location('pathname').should('eq', '/')
  })

  it('explica a volta por sessão expirada (RN010)', () => {
    cy.visit('/entrar?sessao=expirada')

    cy.contains('Sua sessão expirou por inatividade').should('be.visible')
    cy.contains('Nada do que você enviou foi perdido').should('be.visible')
  })

  it('aproveita o e-mail trazido de outra tela', () => {
    cy.visit('/entrar?email=marina@exemplo.com.br')

    cy.get('input[autocomplete="email"]').should('have.value', 'marina@exemplo.com.br')
  })

  it('alterna a visibilidade da senha', () => {
    cy.get('input[autocomplete="current-password"]').should('have.attr', 'type', 'password')

    cy.contains('button', 'Mostrar senha').click()

    cy.get('input[autocomplete="current-password"]').should('have.attr', 'type', 'text')
    cy.contains('button', 'Ocultar senha').should('be.visible')
  })

  it('leva "Esqueci minha senha" ao pedido do link de redefinição', () => {
    cy.intercept('POST', '/api/auth/password/forgot', { statusCode: 202, body: {} }).as('forgot')
    cy.contains('a', 'Esqueci minha senha').click()

    cy.location('pathname').should('eq', '/recuperar-acesso')
    cy.get('input[type="email"]').type('marina@exemplo.com.br')
    cy.contains('button', 'Enviar link de redefinição').click()

    cy.wait('@forgot').its('request.body').should('deep.equal', { email: 'marina@exemplo.com.br' })
    cy.contains('Confira sua caixa de entrada').should('be.visible')
  })

  it('redefine a senha pelo link do e-mail', () => {
    cy.intercept('POST', '/api/auth/password/reset', { body: {} }).as('reset')
    cy.visit('/redefinir-senha?token=ficha-de-teste')

    cy.get('input[autocomplete="new-password"]').eq(0).type('OutraSenhaForte#2026')
    cy.get('input[autocomplete="new-password"]').eq(1).type('OutraSenhaForte#2026')
    cy.contains('button', 'Salvar senha nova').click()

    cy.wait('@reset').its('request.body').should('deep.include', { token: 'ficha-de-teste' })
    cy.contains('Senha redefinida').should('be.visible')
  })

  it('explica a recusa do acesso pelo Google', () => {
    cy.visit('/entrar/google/erro?motivo=conta-existente')

    cy.contains('Já existe uma conta com este e-mail').should('be.visible')
  })

  it('empilha as colunas e encurta o cabeçalho em tela estreita', () => {
    cy.viewport(360, 800)
    cy.visit('/entrar')

    cy.contains('Instituto Meridiano').should('be.visible')
    cy.contains('Atendimento a requisições de titulares de dados').should('not.be.visible')
    cy.contains('Não consegue entrar').should('exist')
  })
})
