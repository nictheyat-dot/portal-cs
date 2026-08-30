# Publicar no Netlify

Desde que o histórico de expulsões passou a usar uma Netlify Function (ver
[BANCO-DE-DADOS.md](BANCO-DE-DADOS.md)), o site deixou de ser "só arrastar arquivos" —
ele precisa que o Netlify rode o build e publique a função. A forma recomendada agora é
a **Opção 2** abaixo.

---

## Opção recomendada — conectado ao GitHub

1. O repositório já existe no GitHub (ver a raiz do projeto para o link).
2. No Netlify, no site já existente (`portalcs.netlify.app`): **Site configuration →
   Build & deploy → Link repository** (ou, se o site for novo: **Add new site → Import an
   existing project**) e escolha o repositório.
3. Configure exatamente (o [netlify.toml](../netlify.toml) na raiz já traz esses valores,
   mas confirme na tela do Netlify):
   - **Build command:** `node build-publicacao/build.mjs`
   - **Publish directory:** `build-publicacao/site`
   - **Functions directory:** `netlify/functions`
4. A cada `push` no branch de produção (`main`), o Netlify instala as dependências
   (`@netlify/blobs`, listada em `package.json`), roda o build e publica sozinho — a
   função `expulsoes` fica disponível automaticamente, sem nenhuma variável de ambiente
   para configurar (ver [BANCO-DE-DADOS.md](BANCO-DE-DADOS.md)).
5. O domínio (`portalcs.netlify.app`) continua o mesmo: você está apontando o site já
   existente para o repositório, não criando um site novo.

---

## Opção alternativa — arrastar e soltar (sem histórico compartilhado funcionando)

Ainda é possível gerar `build-publicacao/site` manualmente e arrastar a pasta em
**Deploys → Drag and drop**, mas **a Netlify Function não é publicada por esse caminho**
— um deploy manual não roda o passo de instalar dependências nem empacotar a função. Sem
a função, `/api/expulsoes` responde 404 e a aba **REGISTROS** mostra erro ao carregar (o
site não quebra, mas o histórico compartilhado fica indisponível). Use isto só para
testar o visual rapidamente, nunca como forma definitiva de publicar.

```bash
node build-publicacao/build.mjs
```

Cria **`build-publicacao/site`** com a versão enxuta (HTML e CSS minificados). O script
confere sozinho se todo arquivo usado pelo site foi copiado e falha se faltar algum.

---

## O que já vem configurado

O arquivo [netlify.toml](../netlify.toml) na raiz aplica:

- **Build**: comando, diretório de publicação e diretório de functions (ver acima).
- **Redirect**: `/api/expulsoes` → `/.netlify/functions/expulsoes`, para o front-end não
  precisar conhecer o caminho interno das functions.
- **Cabeçalhos de segurança**: `Content-Security-Policy` (incluindo `connect-src 'self'`,
  necessário para o `fetch` até a própria função), `X-Content-Type-Options`,
  `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` e
  `Cross-Origin-Opener-Policy`.
- **Cache**: fontes por 1 ano, imagens por 30 dias, `index.html` sempre revalidado.

O HTTPS do Netlify é automático, e é ele que libera a cópia para a área de transferência
em qualquer computador ou celular.

---

## Depois de publicar

- Mande o link para os supervisores; funciona em qualquer navegador moderno, inclusive
  celular.
- **O histórico agora é compartilhado**: uma expulsão registrada em um dispositivo
  aparece nos outros ao abrir/atualizar a aba REGISTROS — não depende mais do navegador
  de quem criou (ver [BANCO-DE-DADOS.md](BANCO-DE-DADOS.md)).
- O site não usa cookies nem coleta dados: nada de banner de consentimento.
- Se quiser restringir o acesso só à Liderança/supervisores, o Netlify oferece
  **Password protection** ou **Identity** nas configurações do site (planos pagos para
  senha por site).
