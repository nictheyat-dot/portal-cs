# Segurança e limites

## O que está protegido

- **Nenhum segredo no código.** Não existe chave de API, token, senha ou endereço
  administrativo dentro dos arquivos. As credenciais que a função
  [netlify/functions/expulsoes.mjs](../netlify/functions/expulsoes.mjs) usa para falar
  com o Netlify Blobs são injetadas automaticamente pelo runtime da Netlify — não passam
  por variável de ambiente configurável nem chegam ao navegador.
- **Nada do que o usuário digita vira HTML.** A tela é montada com `textContent` e
  `<template>`, então um nick não tem como virar script (XSS).
- **Nicks são limpos duas vezes**: no navegador (por UX) e de novo dentro da função
  Netlify, antes de gravar (`[ ] < > " '` removidos, texto cortado em 40 caracteres). A
  validação do cliente nunca é a última palavra — quem decide o que entra no histórico é
  o servidor.
- **Política de conteúdo (CSP)** declarada na página e também como cabeçalho HTTP no
  [netlify.toml](../netlify.toml): nada de script ou estilo embutido, nada de `eval`,
  imagens só da própria origem e do `habbo.com.br`, e `connect-src` restrito a `self` —
  o site só consegue chamar a própria API, nenhum domínio externo.
- **Zero cookies e zero rastreadores.** Nem o site nem a fonte usada geram cookie; a
  Poppins está hospedada junto com o projeto, sem chamada ao Google.
- **Payload limitado na API**: a função rejeita corpo sem os campos obrigatórios, corta o
  BBCode enviado em 20 000 caracteres e mantém no máximo 300 registros no histórico —
  mesmo limite que já existia na versão local.

## O que não dá para proteger só no site

Estas coisas são limitação real de qualquer aplicação que roda no navegador. Não adianta
truque:

- **Todo o código pode ser lido e copiado.** Minificar ou ofuscar não protege nada — quem
  abre o inspetor vê tudo. Bloquear botão direito ou F12 só atrapalha quem usa de verdade.
- **Permissão não pode ser garantida no cliente.** Campo digitado, parâmetro na URL: tudo
  isso o usuário edita em dois cliques. Por isso o gerador **não finge** validar se quem
  está usando é `unloav` ou `Energyy` — o nick do "responsável" é uma informação que a
  pessoa declara ao preencher o formulário, não uma prova de identidade.
- **Sem identidade autenticada, não existe "só a Liderança pode fazer X".** Qualquer
  supervisor com o link consegue registrar uma expulsão. Isso já era assim quando o
  histórico era local; a diferença agora é que o registro passa a ser visto por todos, em
  vez de ficar isolado no navegador de quem criou.

## Exclusão remota — senha compartilhada, não autenticação

A versão anterior guardava o histórico no `localStorage` do navegador — cada supervisor
via só o próprio histórico, então uma lixeira ali só apagava a cópia local de quem
clicou. Com o histórico compartilhado, apagar um registro afeta **todo mundo ao mesmo
tempo**. O projeto ainda não tem identidade autenticada (login), então a exclusão em
[netlify/functions/expulsoes.mjs](../netlify/functions/expulsoes.mjs) (`DELETE`) é
protegida por uma **senha única compartilhada com a Liderança** (`SENHA_EXCLUSAO`, no
topo do arquivo), pedida numa caixinha ao clicar na lixeira de um registro.

Seja claro sobre o que isso é e o que não é:

- **É** uma trava contra clique acidental — impede que qualquer pessoa que abra o site
  apague um registro sem querer ou por curiosidade.
- **Não é** controle de acesso de verdade. A senha viaja no corpo da requisição e
  aparece nas ferramentas de desenvolvedor do navegador de quem a usar; qualquer pessoa
  que descubra a senha (por exemplo vendo a rede do navegador) consegue apagar qualquer
  registro. A exclusão também não fica vinculada a **quem** a fez — não há log de autor.
- Por isso a senha deve ser tratada como uma combinação de time, não como uma credencial
  individual, e trocada em `SENHA_EXCLUSAO` (dentro de `expulsoes.mjs`, seguido de um
  novo deploy) se algum dia vazar além da Liderança.

Restrição de verdade só existe com identidade autenticada **validada no servidor**. Se um
dia este projeto ganhar login (por exemplo integrado ao DME System), a exclusão deveria
passar a checar a sessão do próprio pedido (cookie ou token) em vez da senha fixa, e cada
exclusão poderia ficar registrada (o campo `status` do registro já existe pensando nesse
cenário — hoje toda criação usa `"ativo"`, sem histórico de quem mudou o quê).
