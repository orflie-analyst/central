# Central — Orflie

Portal interno de acesso aos sistemas da Orflie: logo, cards linkando pra cada
sistema publicado (Sistema de Ordem de Serviço, Fluxograma Organizacional, e
qualquer um novo que vier depois) e um quadro de avisos institucional. Pensado
como ponto de entrada único — a ideia é que os colaboradores comecem por aqui e
cliquem no sistema que precisam, em vez de guardar várias URLs separadas.

Terceiro projeto irmão de [ServiceOrder](../ServiceOrder/CONTEXT.md) e
[FluxogramaOrganizacional](../FluxogramaOrganizacional/CONTEXT.md) — mesma stack e
a maior parte do código reaproveitados de lá (`app/dom.js`, `app/auth.js`,
`admin.html`, `conta.html`, `style.css`/logo), mas repositório e projeto Firebase
**próprios**, como os outros dois.

## Stack

- Firebase Auth (email/senha) + Firestore. **Sem auto-cadastro** — mesma decisão do
  Fluxograma: só admin cria conta.
- Site estático (HTML/CSS/JS módulo, sem build) publicado no GitHub Pages.

## Contas

- **GitHub**: repo `orflie-analyst/central`, mesma conta usada nos outros dois.
- **Firebase**: projeto próprio `orflie-central` (ver `.firebaserc`), na conta
  Google `arnaldo.hungria@orflie.com`.

## Modelo de dados (Firestore)

- `usuarios/{uid}`: `nome`, `email`, `isAdmin`, `ativo` — mesmo formato dos outros
  dois projetos (contas **não são compartilhadas** entre os três; um login aqui não
  serve pra entrar no ServiceOrder ou no Fluxograma, cada um tem sua própria base
  de usuários).
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

`usuarios`: só admin cria/gerencia. `avisos`: leitura pra qualquer usuário ativo,
escrita (criar/editar/excluir) só admin.

## Páginas

- `index.html` — login (sem opção de criar conta).
- `central.html` — a página principal: logo grande, grid de cards de sistemas
  (`.sistema-card`, cada um com cor própria via `--sistema-cor`), e o quadro de
  avisos (lista + formulário de publicar, visível só pra admin) com sincronização
  em tempo real via `onSnapshot`.
- `admin.html` — CRUD de usuário (criar + editar nome/isAdmin/ativo).
- `conta.html` — trocar a própria senha.

## Navegação entre sistemas

`app/auth.js`/`renderTopbar()` nos outros dois projetos (ServiceOrder e
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

## Status

Em construção — ver o plano/histórico da sessão que criou este projeto.
