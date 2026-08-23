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
percorridos e testados antes de haver API, e somem junto com o serviço falso —
inclusive o quadro "Só no protótipo" que as lista na tela de acesso.

Uma ressalva que sobrevive ao back-end: a contagem de tentativas e o bloqueio do
RN008 rodam no navegador **porque ainda não há servidor**. Proteção contra força
bruta precisa morar no servidor; o que o cliente faz é apenas explicar o bloqueio
a quem está na tela.

### Design

As telas vêm do projeto no Claude Design
`ddc13361-c194-4fda-9c07-60e119fc5b6d`:

| Tela | Arquivo do design |
| --- | --- |
| `/` | `Pagina Inicial Publica.dc.html` |
| `/registrar` | `Registro de Conta.dc.html` |
| `/entrar` | `Login.dc.html` |

Os tokens de cor e tipografia foram extraídos desses arquivos para o bloco
`@theme` de `src/assets/styles/main.css`.

O mockup traz dois quadros — 1280 px e 360 px — que são **a mesma página em duas
larguras**, e não duas páginas. Onde o quadro de 360 px encurtava o texto,
mantivemos a redação completa: manter duas versões da mesma frase não se sustenta
e esconderia conteúdo de quem acessa pelo celular.
