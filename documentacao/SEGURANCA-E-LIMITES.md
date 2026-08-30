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

## Por que não existe exclusão remota

A versão anterior guardava o histórico no `localStorage` do navegador — cada supervisor
via só o próprio histórico, então uma lixeira ali só apagava a cópia local de quem
clicou. Com o histórico compartilhado isso muda de figura: apagar um registro apagaria
o histórico de **todo mundo ao mesmo tempo**, e restringir o botão a certos nicks no
navegador daria uma falsa sensação de controle — quem quisesse editar o pedido pelo
inspetor do navegador continuaria conseguindo.

Por isso a API em [netlify/functions/expulsoes.mjs](../netlify/functions/expulsoes.mjs)
só responde a `GET` (listar) e `POST` (registrar). Não existe rota de exclusão nem de
edição — a única forma de remover algo hoje é diretamente no painel do Netlify (Blobs),
manualmente, por quem administra o site.

Restrição de verdade só existe com identidade autenticada **validada no servidor**. Se um
dia este projeto ganhar login (por exemplo integrado ao DME System):

1. A função precisa checar a sessão do próprio pedido (cookie ou token), nunca confiar em
   um campo enviado pelo navegador dizendo quem é o usuário.
2. Só então caberia adicionar `DELETE`/`PATCH` em `expulsoes.mjs`, com a permissão
   conferida **no servidor**.
3. Aí sim o histórico passa a suportar correções e exclusões, com auditoria de quem fez o
   quê — o campo `status` do registro já existe pensando nesse cenário (hoje sempre
   `"ativo"`, sem nenhuma tela para mudar isso).

Enquanto isso não existir, o histórico compartilhado é **de criação e consulta**: tudo
que for registrado fica registrado.
