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
    notifications/         avisos do sino do cabeçalho
      composables/ data/ types/
    requests/              requisições de titulares, do registro ao desfecho
      components/ composables/ constants/ data/ services/ types/ utils/
    reports/               indicadores de atendimento
      components/ composables/ constants/ data/ services/ types/ utils/
  shared/layout/           moldura das telas autenticadas (cabeçalho e rodapé)
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

### As telas de dentro do sistema

Quatro telas já existem atrás do login: abrir uma requisição, a fila de
atendimento, o atendimento de uma requisição e o relatório gerencial.

| URL | Tela | Perfil |
| --- | --- | --- |
| `/requisicoes/nova` | Nova requisição (RF004) | titular |
| `/painel/fila` | Fila de atendimento (RF008 / RF009) | encarregado |
| `/painel/requisicoes/2026-000418` | Requisição vencida, em análise | encarregado |
| `/painel/requisicoes/2026-000431` | Requisição aguardando complemento | encarregado |
| `/painel/requisicoes/2026-000392` | Requisição concluída, em leitura | encarregado |
| `/painel/relatorios` | Relatório gerencial (RF028) | encarregado |

**Não há sessão nem autorização.** `features/auth/composables/useSession.ts` é a
emenda onde elas vão entrar; enquanto não há servidor, ela devolve a conta de
demonstração do perfil que a rota exige, e é isso que permite abrir qualquer
tela digitando o endereço. Vale a mesma ressalva do bloqueio do RN008: decidir
quem pode ver a fila de uma organização é trabalho do servidor, e esconder um
link no navegador nunca foi proteção.

A fila filtrada tem endereço próprio — `/painel/fila?prazo=vencidas` abre já
recortada. É o "filtros no endereço" do quadro 1b do design: um recorte pode
ser enviado a um colega sem explicação.

### As requisições de demonstração

Vivem em `features/requests/data/` e, como os convites, têm **datas relativas a
hoje**. Uma fila com datas gravadas no código venceria inteira com o tempo, e a
tela existe justamente para mostrar a diferença entre uma requisição vencida,
uma que vence em poucos dias e uma em dia.

Três divergências deliberadas em relação ao mockup, todas para manter o sistema
coerente consigo mesmo:

- **A titular não é Helena Prado Vasconcelos.** No design ela aparece ao mesmo
  tempo como encarregada do portal público e como titular que abre pedidos
  contra a própria organização. Aqui ela continua sendo a encarregada, e quem
  abre os pedidos é Marina Torres de Almeida, a conta de titular de
  `features/auth/data/accounts.ts`.
- **As unidades mudaram de cidade.** O Instituto Meridiano fica em Franca/SP,
  e o mockup situava os atendimentos em Belo Horizonte.
- **Beatriz Falcão e Caio Duarte são analistas**, não encarregados: são os nomes
  que o mockup usava na coluna "responsável" da fila.

O relatório gerencial precisa de mais do que oito requisições para que um
gráfico diga alguma coisa, então `features/reports/data/history.ts` completa o
ano com atendimentos encerrados. A base é gerada por um gerador congruente
linear com semente fixa: os mesmos números em toda execução, porque um
relatório que mudasse a cada recarga não serviria nem para conferir uma conta
nem para ilustrar um texto.

Duas regras do relatório que valem registro, porque são de apuração e não de
exibição: requisições canceladas pelo titular ficam fora do tempo médio e do
cálculo de prazo, e a satisfação agregada some quando o recorte tem menos de
cinco respostas — nesse tamanho, uma média apontaria para quem respondeu.

### Design

As telas vêm do projeto no Claude Design
`ddc13361-c194-4fda-9c07-60e119fc5b6d`:

| Tela | Arquivo do design |
| --- | --- |
| `/` | `Pagina Inicial Publica.dc.html` |
| `/registrar` | `Registro de Conta.dc.html` |
| `/entrar` | `Login.dc.html` |
| `/convite/:token` | `Registro de Conta.dc.html` (quadro 1c) |
| `/requisicoes/nova` | `Nova Requisicao.dc.html` |
| `/painel/fila` | `Fila de Atendimento.dc.html` |
| `/painel/requisicoes/:protocolo` | `Detalhe da Requisicao Encarregado.dc.html` |
| `/painel/relatorios` | `Relatorio Gerencial.dc.html` |

Os tokens de cor e tipografia foram extraídos desses arquivos para o bloco
`@theme` de `src/assets/styles/main.css`.

O mockup traz dois quadros — 1280 px e 360 px — que são **a mesma página em duas
larguras**, e não duas páginas. Onde o quadro de 360 px encurtava o texto,
mantivemos a redação completa: manter duas versões da mesma frase não se sustenta
e esconderia conteúdo de quem acessa pelo celular.
