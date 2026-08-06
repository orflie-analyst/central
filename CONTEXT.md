# Central — Orflie

Portal interno de acesso aos sistemas da Orflie e **porta de entrada única**: logo,
cards linkando pra cada sistema publicado (Sistema de Ordem de Serviço, Updates, e
Fluxograma Organizacional) e um quadro de avisos institucional. Pensado como ponto
de entrada único — a ideia é que os colaboradores comecem por aqui e cliquem no
sistema que precisam, em vez de guardar várias URLs separadas.

Projeto irmão de [ServiceOrder](../ServiceOrder/CONTEXT.md),
[Updates](https://github.com/orflie-analyst/updates) e
[FluxogramaOrganizacional](../FluxogramaOrganizacional/CONTEXT.md) — mesma stack e
a maior parte do código reaproveitados de lá (`app/dom.js`, `app/auth.js`,
`admin.html`, `conta.html`, `style.css`/logo).

## Stack

- Firebase Auth (email/senha) + Firestore. **Auto-cadastro habilitado** em
  `index.html` para qualquer email `@orflie.com`/`@orflie.com.br` (decisão de
  login único, 2026-08) — mesmo autocadastro existe no ServiceOrder e no Updates,
  todos escrevem no mesmo doc.
- Site estático (HTML/CSS/JS módulo, sem build) publicado no GitHub Pages.
- **Projeto Firebase compartilhado com ServiceOrder e Updates** (login único,
  2026-08): os três autenticam contra `orflie-serviceorder` — uma conta criada em
  qualquer um dos três já funciona nos outros dois. **Fluxograma Organizacional
  fica de fora dessa unificação de propósito** — projeto Firebase próprio, login
  independente, uso exclusivo da diretoria.
- Não existe mais `firebase.json`/`.firebaserc`/`firestore.rules` neste
  repositório — quem possui e deploya as regras é o repositório do ServiceOrder
  (`orflie-analyst/serviceorder/firestore.rules`, seção `avisos` no fim do
  arquivo).

## Contas

- **GitHub**: repo `orflie-analyst/central`, mesma conta usada nos outros.
- **Firebase**: `orflie-serviceorder` — **não é mais projeto próprio** (antes era
  `orflie-central`, migrado em 2026-08 pra login único; config antigo preservado
  no histórico do git caso precise reverter).

## Modelo de dados (Firestore)

- `usuarios/{uid}`: `nome`, `email`, `isAdmin`, `departamentosPrestador`, `ativo`,
  `criadoEm` — **coleção compartilhada** com ServiceOrder e Updates (mesmo doc,
  mesmo projeto). Um login aqui já serve pra entrar nos outros dois.
- `avisos/{avisoId}`: `titulo`, `texto`, `autorId`, `autorNome`, `criadoEm`. Mural
  institucional — qualquer usuário ativo lê, só admin publica/exclui (não é um
  mural aberto tipo fórum).

Não existe coleção pros "sistemas" (os cards da Central) — a lista vive
hardcoded no array `SISTEMAS` em `app/central.js`, com um comentário no próprio
código lembrando de adicionar um item ali sempre que um novo sistema Orflie for
publicado. Decisão deliberada: adicionar um sistema novo já significa mexer em
código (o próprio sistema tem que ser construído), então não precisa de uma UI de
CRUD separada só pra essa lista — editar um array é mais simples e não faz
diferença de fricção pra quem só vai fazer isso ocasionalmente (eu, via Claude
Code).

## Regras de segurança

Não há `firestore.rules` neste repositório — as regras de `usuarios`/`avisos`
vivem no `firestore.rules` do repositório `orflie-analyst/serviceorder` (projeto
compartilhado). Resumo: `usuarios` só admin cria/gerencia (exceto autocadastro,
sempre com privilégios mínimos); `avisos` leitura pra qualquer usuário ativo,
escrita (criar/editar/excluir) só admin.

## Páginas

- `index.html` — login **e auto-cadastro** (toggle entre os dois forms; cadastro
  exige email `@orflie.com`/`@orflie.com.br`).
- `central.html` — a página principal: logo grande, grid de cards de sistemas
  (`.sistema-card`, cada um com cor própria via `--sistema-cor`), e o quadro de
  avisos (lista + formulário de publicar, visível só pra admin) com sincronização
  em tempo real via `onSnapshot`.
- `admin.html` — CRUD de usuário (criar + editar nome/isAdmin/ativo). Como
  `isAdmin` é compartilhado, promover alguém aqui promove no ServiceOrder e no
  Updates também.
- `conta.html` — trocar a própria senha.

## Navegação entre sistemas

`app/auth.js`/`renderTopbar()` nos outros projetos (ServiceOrder, Updates e
FluxogramaOrganizacional) ganhou um link "← Central" apontando pra
`https://orflie-analyst.github.io/central/`, pra fechar o ciclo — dá pra voltar
pro hub de qualquer um dos sistemas, não só entrar por ele.

## Gotchas conhecidos (herdados dos projetos irmãos)

- **XSS**: nunca `innerHTML` com dado de usuário — sempre `createElement`/
  `textContent` (helper `el()` em `app/dom.js`).
- **Criação de usuário sem apagar sessão do admin**: `admin.html` usa uma segunda
  instância nomeada do Firebase App (`getAdminCreationApp()`).
- **Regras do Firestore vs. UI**: qualquer permissão nova tem que ser reforçada em
  `firestore.rules`, não só escondida na UI.
- **Cache do GitHub Pages**: assets servem `Cache-Control: max-age=600` — pra
  verificar uma mudança recém-publicada sem esperar até 10 min, importar o módulo
  com `?v=` cache-buster ou usar `curl` direto confirma o que já está na origem.

## Status (2026-08-07)

Login único com ServiceOrder e Updates aplicado: `firebase-init.js` aponta pro
projeto compartilhado, `auth.js` ganhou `signup()`, `index.html` ganhou o form de
autocadastro, `central.js` lista os três sistemas (ServiceOrder, Updates,
Fluxograma). Pendente: migrar os dados antigos de `avisos` e o usuário admin do
projeto `orflie-central` (desativado, mantido como rede de segurança) pro
`orflie-serviceorder`.
