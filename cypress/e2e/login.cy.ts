/**
 * Acesso à conta — RF003 / RN008 a RN010.
 *
 * Percorre a tela como quem tenta entrar: a recusa que não entrega qual campo
 * errou, a contagem até o bloqueio, a conta pendente de confirmação e o
 * destino conforme o perfil.
 */
const DEMO_PASSWORD = 'SenhaSegura!123'

function signIn(email: string, password: string) {
  cy.get('input[autocomplete="email"]').clear()
  cy.get('input[autocomplete="email"]').type(email)
  cy.get('input[autocomplete="current-password"]').clear()
  cy.get('input[autocomplete="current-password"]').type(password)
  cy.get('button[type="submit"]').click()
}

describe('Acesso à conta', () => {
  beforeEach(() => {
    cy.visit('/entrar')
  })

  it('apresenta a tela e a saída para quem ainda não tem conta', () => {
    cy.get('h1').should('contain.text', 'Entrar')
    cy.contains('Ainda não tem conta?').should('be.visible')
    cy.contains('a', 'Criar conta').should('have.attr', 'href', '/registrar')
  })

  it('recusa credenciais erradas sem dizer qual campo falhou (RN009)', () => {
    signIn('titular@exemplo.com.br', 'senhaerrada')

    cy.contains('E-mail ou senha incorretos').should('be.visible')
    cy.contains('Restam 4 tentativas').should('be.visible')
    // Marcar um dos campos contaria se aquele e-mail tem conta no portal.
    cy.get('[aria-invalid="true"]').should('not.exist')
  })

  it('bloqueia a conta na quinta recusa seguida, com contagem regressiva (RN008)', () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      signIn('titular@exemplo.com.br', 'senhaerrada')
    }

    cy.contains('Acesso bloqueado por 15 minutos').should('be.visible')
    cy.contains('até liberar').should('be.visible')
    cy.contains(/^\d{2}:\d{2}$/).should('be.visible')
    cy.get('input[autocomplete="email"]').should('be.disabled')
    cy.get('button[type="submit"]').should('be.disabled')
  })

  it('não gasta tentativa quando falta confirmar o e-mail (RN005)', () => {
    signIn('pendente@exemplo.com.br', DEMO_PASSWORD)

    cy.contains('Falta confirmar o e-mail desta conta').should('be.visible')
    cy.contains('Reenviar o link').should('be.visible')
    cy.contains('Tentativas usadas').should('not.exist')
  })

  it('leva o titular aos próprios pedidos, sem perguntar o perfil', () => {
    signIn('titular@exemplo.com.br', DEMO_PASSWORD)

    cy.location('pathname').should('eq', '/requisicoes')
    cy.get('h1').should('contain.text', 'Minhas requisições')
  })

  it('leva a encarregada à fila, e as páginas comuns passam a falar com ela', () => {
    // Largura de computador: o link de ajuda fica à vista no cabeçalho.
    cy.viewport(1440, 900)
    signIn('helena.vasconcelos@meridianosaude.org.br', DEMO_PASSWORD)

    cy.location('pathname').should('eq', '/painel/fila')
    cy.get('h1').should('contain.text', 'Fila de atendimento')

    // Sem recarregar: a sessão vive na memória da página.
    cy.get('header').contains('a', 'Ajuda').click()
    cy.contains('h2', 'Registrar em nome do titular').should('be.visible')
  })

  it('não volta ao formulário de acesso pelo botão de voltar', () => {
    cy.visit('/')
    cy.get('header').contains('a', 'Entrar').click()
    signIn('titular@exemplo.com.br', DEMO_PASSWORD)
    cy.location('pathname').should('eq', '/requisicoes')

    cy.go('back')
    cy.location('pathname').should('eq', '/')
  })

  it('explica a volta por sessão expirada (RN010)', () => {
    cy.visit('/entrar?sessao=expirada')

    cy.contains('Sua sessão expirou por inatividade').should('be.visible')
    cy.contains('Nada do que você enviou foi perdido').should('be.visible')
  })

  it('aproveita o e-mail trazido pela recusa de cadastro', () => {
    cy.visit('/entrar?email=marina@exemplo.com.br')

    cy.get('input[autocomplete="email"]').should('have.value', 'marina@exemplo.com.br')
  })

  it('alterna a visibilidade da senha', () => {
    cy.get('input[autocomplete="current-password"]').should('have.attr', 'type', 'password')

    cy.contains('button', 'Mostrar senha').click()

    cy.get('input[autocomplete="current-password"]').should('have.attr', 'type', 'text')
    cy.contains('button', 'Ocultar senha').should('be.visible')
  })

  it('não deixa "Esqueci minha senha" sem destino', () => {
    cy.contains('a', 'Esqueci minha senha').click()

    cy.location('pathname').should('eq', '/recuperar-acesso')
  })

  it('empilha as colunas e encurta o cabeçalho em tela estreita', () => {
    cy.viewport(360, 800)
    cy.visit('/entrar')

    cy.contains('Instituto Meridiano').should('be.visible')
    cy.contains('Atendimento a requisições de titulares de dados').should('not.be.visible')
    cy.contains('Não consegue entrar').should('exist')
  })
})
