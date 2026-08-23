# frontend-dsars

Front-end da **Tutela**, plataforma em que organizações recebem e conduzem
**requisições de titulares de dados** previstas na Lei Geral de Proteção de Dados
(Lei nº 13.709/2018). Projeto de TCC.

Cada organização cliente tem o seu próprio portal público: o mesmo produto, com a
identificação, a pessoa encarregada e os contatos daquela organização.

## Stack

Vue 3 (Composition API com `<script setup>`), TypeScript, Vite, Vue Router, Pinia,
Tailwind CSS v4, Vitest e Cypress.

## Como rodar

```sh
pnpm install
pnpm dev            # ambiente de desenvolvimento
pnpm build          # type-check + build de produção
pnpm test:unit      # testes de unidade (Vitest)
pnpm test:e2e       # testes de ponta a ponta (Cypress, sobre o build)
pnpm lint           # oxlint + ESLint, com correção automática
pnpm type-check     # vue-tsc
```

## Organização do código

```
src/
  assets/styles/main.css   Tailwind + tokens de design (@theme)
  shared/                  o que atravessa funcionalidades
    ui/                    componentes de base (prefixo Base*)
    types/  constants/     tipos e listas de domínio (ex.: direitos do art. 18)
  features/                uma pasta por área do produto
    tenant/                organização dona do portal
      types/ data/ composables/
    landing/               página inicial pública
      components/ data/ types/
    auth/                  criar conta e entrar
      components/ composables/ constants/ data/ services/ types/
  views/                   destinos de rota
  router/                  definição das rotas
```

A regra é simples: **código de domínio mora em `features/`**, e só sobe para
`shared/` quando mais de uma funcionalidade precisa dele. Cada nova tela do
sistema (fila de atendimento, nova requisição, relatório gerencial…) entra como
uma pasta em `features/` sem mexer nas outras.

### De onde vem o conteúdo da página

Nada de texto variável fica preso no template. Os dados da organização vêm de
`features/tenant/composables/useTenant.ts`, hoje servidos por uma configuração
fixa em `features/tenant/data/`. **Essa função é a única emenda com a origem dos
dados**: quando o back-end existir, basta trocar o corpo dela — por exemplo,
resolvendo o tenant pelo subdomínio — sem tocar em nenhum componente.

### As contas ainda não têm servidor

`features/auth/services/` cumpre para as contas o mesmo papel que `useTenant()`
cumpre para a organização: é a emenda com o back-end. As telas de cadastro e de
acesso já conversam com essas funções — inclusive nos casos de recusa — e
responder de verdade é trocar o corpo delas por chamadas HTTP, sem tocar em
componente nenhum.

Enquanto isso, elas respondem a partir das contas de demonstração em
`features/auth/data/accounts.ts`, que são as mesmas publicadas no protótipo do
design. Existem para que os estados previstos nas regras de negócio (e-mail já
cadastrado, conta pendente de confirmação, bloqueio por tentativas) possam ser
percorridos e testados antes de haver API, e somem junto com o serviço falso.

Senha `SenhaSegura!123` para todas; qualquer outra combinação falha, como no
sistema real.

| Conta | Para exercitar |
| --- | --- |
| `titular@exemplo.com.br` | acesso de titular |
| `helena.vasconcelos@meridianosaude.org.br` | acesso de encarregado |
| `pendente@exemplo.com.br` | conta sem o e-mail confirmado (RN005) |

O bloqueio do RN008 se desfaz sozinho ao fim dos 15 minutos; para não esperar,
recarregue a página.

Uma ressalva que sobrevive ao back-end: a contagem de tentativas e o bloqueio do
RN008 rodam no navegador **porque ainda não há servidor**. Proteção contra força
bruta precisa morar no servidor; o que o cliente faz é apenas explicar o bloqueio
a quem está na tela. Vale o mesmo para o vencimento de um convite: quem valida
um token é o servidor, e conferir a data aqui só serve para a tela ter o que
mostrar.

### O convite de encarregado

`/convite/:token` é a mesma tela de cadastro com duas diferenças que vêm do
convite: o e-mail chega travado, porque trocá-lo desfaria o vínculo, e não há
escolha de perfil — ele foi atribuído por quem convidou. A conta nasce com o
e-mail já confirmado: o link foi enviado para aquele endereço e aberto por quem o
recebeu, que é a mesma prova que o RN005 pede no cadastro comum.

Como um convite chega por e-mail, nenhum dos estados é alcançável pela navegação:
chega-se a cada um pela URL. Os convites de demonstração vivem em
`features/auth/data/invites.ts`, e as datas deles são relativas a hoje em vez de
fixas — um convite "válido" com data gravada no código venceria sozinho e levaria
consigo a tela que ele existe para demonstrar.

| URL | Estado |
| --- | --- |
| `/convite/convite-valido` | convite em aberto |
| `/convite/convite-expirado` | convite vencido |
| `/convite/convite-usado` | conta do convite já criada |
| `/convite/` + qualquer outro código | convite inexistente |

### Design

As telas vêm do projeto no Claude Design
`ddc13361-c194-4fda-9c07-60e119fc5b6d`:

| Tela | Arquivo do design |
| --- | --- |
| `/` | `Pagina Inicial Publica.dc.html` |
| `/registrar` | `Registro de Conta.dc.html` |
| `/entrar` | `Login.dc.html` |
| `/convite/:token` | `Registro de Conta.dc.html` (quadro 1c) |

Os tokens de cor e tipografia foram extraídos desses arquivos para o bloco
`@theme` de `src/assets/styles/main.css`.

O mockup traz dois quadros — 1280 px e 360 px — que são **a mesma página em duas
larguras**, e não duas páginas. Onde o quadro de 360 px encurtava o texto,
mantivemos a redação completa: manter duas versões da mesma frase não se sustenta
e esconderia conteúdo de quem acessa pelo celular.
