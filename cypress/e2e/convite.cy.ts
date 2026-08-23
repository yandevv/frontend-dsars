/**
 * Cadastro por convite — variante do quadro 1c de `Registro de Conta.dc.html`.
 *
 * Percorre a tela como quem recebeu o link por e-mail: o vínculo antes do
 * aceite, o e-mail que não se troca, e os três links que não levam a lugar
 * nenhum — vencido, já usado e inexistente.
 */
const VALID_PASSWORD = 'SenhaSegura!123'

function fillForm() {
  cy.get('input[autocomplete="name"]').type('Bruno Carvalho de Souza')
  cy.get('input[placeholder="Mínimo de 12 caracteres"]').type(VALID_PASSWORD)
  cy.get('input[placeholder="Repita a senha"]').type(VALID_PASSWORD)
  cy.get('input[type="checkbox"]').check()
}

describe('Convite de encarregado', () => {
  it('mostra o vínculo que está sendo aceito antes do formulário ser enviado', () => {
    cy.visit('/convite/convite-valido')

    cy.get('h1').should('contain.text', 'Aceitar o convite e criar sua conta')
    cy.contains('Vínculo que você está aceitando').should('be.visible')
    cy.contains('Instituto Meridiano de Saúde').should('be.visible')
    cy.contains('CNPJ 12.345.678/0001-90').should('be.visible')
    cy.contains('Encarregado de proteção de dados').should('be.visible')
    cy.contains('Rogério Alencar Bueno').should('be.visible')
  })

  it('trava o e-mail do convite e diz o que fazer para usar outro', () => {
    cy.visit('/convite/convite-valido')

    cy.get('input[type="email"]')
      .should('be.disabled')
      .and('have.value', 'bruno.carvalho@meridianosaude.org.br')
    cy.contains('não pode ser alterado').should('be.visible')
  })

  it('não oferece escolha de perfil: ele vem do convite', () => {
    cy.visit('/convite/convite-valido')

    cy.get('input[type="radio"]').should('not.exist')
    cy.get('select').should('not.exist')
    cy.contains('O perfil não é escolhido no cadastro').should('be.visible')
  })

  it('recusa o envio incompleto sem chamar o serviço', () => {
    cy.visit('/convite/convite-valido')

    cy.get('button[type="submit"]').click()

    cy.contains('Ainda não é possível criar a conta').should('be.visible')
    cy.contains('Informe o nome completo').should('be.visible')
    cy.contains('O aceite é obrigatório').should('be.visible')
  })

  it('cria a conta e dispensa a confirmação de e-mail do RN005', () => {
    cy.visit('/convite/convite-valido')
    fillForm()
    cy.get('button[type="submit"]').click()

    cy.contains('Conta criada e vínculo aceito', { timeout: 10_000 }).should('be.visible')
    cy.contains('não precisa de confirmação').should('be.visible')
    cy.contains('a', 'Entrar no painel de atendimento').should(
      'have.attr',
      'href',
      '/entrar?email=bruno.carvalho@meridianosaude.org.br',
    )
    // Aceito o convite, não há mais o que recusar.
    cy.contains('Recusar o convite').should('not.exist')
  })

  it('explica o convite vencido e oferece pedir outro', () => {
    cy.visit('/convite/convite-expirado')

    cy.get('h1', { timeout: 10_000 }).should('contain.text', 'Este convite venceu em')
    cy.get('form').should('not.exist')
    cy.contains('button', 'Solicitar novo convite').click()
    cy.contains('Pedido registrado', { timeout: 10_000 }).should('be.visible')
  })

  it('manda ao login quem abre um convite já utilizado', () => {
    cy.visit('/convite/convite-usado')

    cy.get('h1', { timeout: 10_000 }).should('contain.text', 'A conta deste convite já foi criada')
    // Escopado ao conteúdo: o cabeçalho também tem um "Entrar", sem o endereço.
    cy.get('main')
      .contains('a', 'Entrar')
      .should('have.attr', 'href', '/entrar?email=helena.vasconcelos@meridianosaude.org.br')
    cy.get('main')
      .contains('a', 'Esqueci a senha')
      .should('have.attr', 'href')
      .and('include', '/recuperar-acesso')
  })

  it('não revela nada sobre um convite que não existe', () => {
    cy.visit('/convite/isto-nao-existe')

    cy.get('h1', { timeout: 10_000 }).should('contain.text', 'Não encontramos este convite')
    // O quadro não cita endereço nenhum: o portal não confirma quem foi convidado.
    // (A lista "Só no protótipo" abaixo é andaime, e sai com o serviço falso.)
    cy.get('h1').parent().should('not.contain.text', '@meridianosaude.org.br')
    cy.contains('a', 'Crie uma conta comum').should('have.attr', 'href', '/registrar')
  })

  it('leva ao cadastro comum e ao contato da encarregada quando o link falha', () => {
    cy.visit('/convite/isto-nao-existe')

    cy.get('a[href^="mailto:"]', { timeout: 10_000 }).should(
      'have.attr',
      'href',
      'mailto:dpo@meridianosaude.org.br',
    )
  })
})
