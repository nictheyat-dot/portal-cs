# Gerador de Cartilhas de Expulsão — Centro de Supervisão

Frontend estático (HTML/CSS/JS puro, sem framework) que gera o **título** e o **BBCode**
das cartilhas de expulsão do CS e mantém um **histórico compartilhado** das expulsões,
persistido no Netlify (função serverless + Netlify Blobs) — o mesmo registro aparece em
qualquer dispositivo que acesse o site, não só no navegador de quem o criou.

---

## Como usar

1. Abra **`index.html`** com duplo clique (Chrome, Edge ou Firefox).
2. Na aba **GERADOR**, preencha os dois nicks e escolha o motivo no seletor.
3. Clique em **GERAR CARTILHA** (ou `Ctrl + Enter`).
4. Copie com **COPIAR TÍTULO** (assunto da mensagem privada) e **COPIAR BBCODE** (corpo).
5. A expulsão é registrada na aba **REGISTROS**.

O BBCode nunca aparece na tela: é montado em memória e vai direto para a área de
transferência. Não existe caixa de texto, pré-visualização nem modal com a cartilha.

### Teclado no seletor de motivo

| Tecla | Ação |
|---|---|
| `Enter` / `Espaço` / `↓` / `↑` | abre a lista |
| `↓` / `↑` | navega |
| `Home` / `End` | primeiro / último |
| `Enter` / `Espaço` | seleciona |
| `Esc` | fecha e devolve o foco |
| letras | salta para o motivo correspondente |

---

## Arquivos

```
GeradorCS/
├── index.html                        página, sprite de ícones e <template> do registro
├── design-visual/estilos.css         visual completo
├── sistema-funcionamento/
│   ├── cartilhas.js                  TEXTOS DAS CARTILHAS (BBCode) e títulos
│   └── aplicacao.js                  seletor, geração, cópia e histórico (API remota)
├── midia-imagens/                    emblema + fundo
├── netlify/functions/expulsoes.mjs   API do histórico compartilhado (Netlify Blobs)
├── build-publicacao/build.mjs        gera build-publicacao/site (build de produção)
├── netlify.toml                      build, headers e redirect da API
└── documentacao/                     manuais (este + segurança, Netlify, banco de dados)
```

---

## Editar as cartilhas

Tudo em [sistema-funcionamento/cartilhas.js](sistema-funcionamento/cartilhas.js). O
BBCode de cada motivo é montado em `CABECALHO + corpo + RODAPE`: o cabeçalho (banner e
saudação) e o rodapé (botões de WhatsApp da Liderança e créditos) são idênticos nos três
motivos e ficam centralizados no topo do arquivo — só o `corpo` muda por motivo.

```js
metaSemanal: {
  id: 'metaSemanal',
  label: 'Meta semanal não cumprida',                      // texto do seletor
  labelCurto: 'Meta Semanal',                              // etiqueta dos registros
  titulo: '[CS] Notificação de Expulsão — Meta Semanal',   // título copiável
  resumo: '...',                                           // ficha do motivo
  fundamentacao: '...',                                    // base regimental
  corpo: `  ...texto específico deste motivo, em BBCode...  `
}
```

Para um motivo novo: copie um bloco, troque `id`, `label`, `titulo` e `corpo`, e
acrescente o `id` em `ORDEM_MOTIVOS`. O seletor se monta sozinho; o `bbcode` final
(cabeçalho + corpo + rodapé) é montado automaticamente no carregamento do script.
Dentro do BBCode não use crase (`` ` ``) nem `${`.

Placeholders: `{USERNAME}` (nick do expulso), `{RESPONSAVEL}`, `{MOTIVO}`, `{DATA}`, `{HORA}`.

---

## Imagens

Emblema em `midia-imagens/emblema-cs.png` (69 KB) e arte de fundo em
`midia-imagens/fundo-desktop.webp` (2560 × 1440, 100 KB). O arquivo pesado de origem do
fundo fica em `midia-imagens/originais/` (não vai para o site publicado).

O fundo fica atrás de toda a interface, preso ao viewport (`position: fixed`), preenchendo
a tela inteira sem repetir e sem distorcer (`cover` + `center center`) — não se desloca com
rolagem nem com zoom. Para trocar, substitua o arquivo mantendo o nome. No mobile (até
768px) essa camada não é carregada: fica só o fundo escuro liso. Detalhes em
[documentacao/EDITAR-CARTILHAS-E-IMAGENS.md](documentacao/EDITAR-CARTILHAS-E-IMAGENS.md).

---

## Registros (histórico compartilhado)

Cada expulsão gerada é enviada para `/api/expulsoes`, uma função Netlify
([netlify/functions/expulsoes.mjs](netlify/functions/expulsoes.mjs)) que grava a lista
num único blob (Netlify Blobs, `store` `expulsoes`, chave `registros`). Qualquer
dispositivo que abrir o site e entrar na aba **REGISTROS** consulta o mesmo blob — não é
mais um histórico por navegador. Detalhes do schema em
[documentacao/BANCO-DE-DADOS.md](documentacao/BANCO-DE-DADOS.md).

O front-end (`Historico.listar` / `Historico.registrar` em
[sistema-funcionamento/aplicacao.js](sistema-funcionamento/aplicacao.js)) busca a lista
ao abrir a aba, ao clicar em **atualizar** e depois de registrar uma nova expulsão. Se a
rede ou o banco falhar, a interface mostra o erro e um botão de tentar novamente — nunca
finge que salvou.

Não existe exclusão remota: apagar um registro apagaria o histórico de todo mundo ao
mesmo tempo, e o projeto ainda não autentica quem está usando o gerador (ver
[documentacao/SEGURANCA-E-LIMITES.md](documentacao/SEGURANCA-E-LIMITES.md)).

---

## Segurança — o que dá e o que não dá para fazer aqui

### Já implementado

- **Nenhum segredo no código**: sem chaves de API, tokens ou endpoints administrativos —
  as credenciais do Netlify Blobs são injetadas pelo próprio runtime da função, nunca
  ficam no frontend nem em variável de ambiente que o navegador possa ler.
- **Sem `innerHTML` com dado de usuário**: a interface é montada com `textContent` e
  `<template>`, então nick nenhum vira HTML executável.
- **Nicks sanitizados** antes de entrar no BBCode, tanto no navegador quanto de novo no
  servidor (`[ ] < > " '` removidos, máx. 40 chars) — a validação do cliente é só UX, a
  função é quem decide o que entra no histórico.
- **CSP** declarada no `<meta>` do [index.html](index.html) e repetida como cabeçalho HTTP
  em [netlify.toml](netlify.toml): sem `default-src`, sem scripts/estilos inline, imagens
  só de `self` e `habbo.com.br`, `connect-src` restrito a `self` (só a própria função).
- **`referrer: no-referrer`** e nenhum `eval`, `new Function` ou handler inline.
- **Sem exclusão remota**: a API só tem `GET` (listar) e `POST` (registrar). Apagar um
  registro afetaria o histórico de todo mundo ao mesmo tempo, e o projeto ainda não
  autentica quem está usando o gerador — então essa operação simplesmente não existe.

### Limitações reais (não têm como ser resolvidas só no frontend)

- Tudo que chega ao navegador **pode ser lido e copiado**. Minificar ou ofuscar não é
  segurança — o `build-publicacao/build.mjs` existe por tamanho e organização, não por
  proteção.
- **Autorização não pode ser garantida no cliente.** Campo digitado, parâmetro de URL:
  tudo é editável pelo usuário. Por isso o gerador não finge validar quem é `unloav` ou
  `Energyy` — quem preenche "Nick do responsável" está apenas descrevendo o registro, não
  provando identidade.
- Os `<meta>` de CSP não cobrem `frame-ancestors` nem `X-Content-Type-Options` — esses
  exigem cabeçalhos HTTP, já aplicados via `netlify.toml` (ver abaixo).

### Se um dia for servido por um servidor web

Cabeçalhos recomendados (exemplo nginx):

```nginx
add_header Content-Security-Policy "default-src 'none'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' https://www.habbo.com.br; base-uri 'none'; form-action 'none'; frame-ancestors 'none'" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer" always;
add_header Permissions-Policy "geolocation=(), camera=(), microphone=(), interest-cohort=()" always;
```

### Autenticação (ainda pendente)

Sem identidade autenticada, "exclusão" e "quem pode registrar" não podem ser controlados
de verdade — qualquer checagem feita só no navegador é decorativa, porque o usuário
controla tudo que roda ali. É por isso que a API de expulsões só aceita criar e listar, e
o nick do "responsável" é uma informação declarada, não uma prova de identidade. Uma
integração futura com um sistema de login (por exemplo o DME System) teria que validar a
sessão dentro da própria função Netlify — nunca confiando em nada vindo do cliente.

---

## Build de produção

```bash
node build-publicacao/build.mjs
```

Gera `build-publicacao/site/` com HTML e CSS minificados e os assets necessários
copiados (ver [documentacao/PUBLICAR-NO-NETLIFY.md](documentacao/PUBLICAR-NO-NETLIFY.md)
para as duas formas de publicar). Ao publicar via GitHub, o Netlify roda esse mesmo
comando sozinho a cada `push`.

---

## Notas de desempenho

- Scripts com `defer` e a fonte Poppins carregada sem bloquear a primeira pintura.
- Emblema otimizado de 455 KB para 69 KB; fundo de 7 MB (PNG) para 100 KB (WebP).
- Lista de registros montada por `<template>` + `DocumentFragment`, com avatares em
  `loading="lazy"`; nada é renderizado enquanto a aba REGISTROS está fechada.
- Busca com debounce sobre a lista já carregada em memória (sem nova chamada à API a
  cada tecla digitada).
