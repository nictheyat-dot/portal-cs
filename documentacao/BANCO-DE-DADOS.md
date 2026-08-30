# Banco de dados do histórico de expulsões

## Por que os dispositivos não compartilhavam registros antes

O histórico ficava inteiramente em `localStorage`, dentro do navegador de quem preenchia
o formulário. `localStorage` é local a um par (navegador, origem) num computador
específico — nunca sai dali, não existe sincronização entre abas de navegadores
diferentes, nem entre computadores, nem entre celular e desktop. Cada supervisor tinha,
literalmente, o próprio histórico particular. Não havia bug: o site nunca teve, até
agora, nenhum lugar remoto para gravar esse dado.

## Tecnologia escolhida: Netlify Blobs + Netlify Functions

O projeto é (e continua sendo) um site estático hospedado no Netlify, sem nenhum backend
antes desta mudança. Em vez de introduzir uma conta e um serviço novos (Supabase,
Firebase etc.), a solução mais simples e igualmente segura é usar o que o próprio
Netlify já oferece a qualquer site nele hospedado:

- **Netlify Functions** — uma função serverless (`netlify/functions/expulsoes.mjs`) serve
  de API, acessível pelo próprio site em `/api/expulsoes` (redirecionado para
  `/.netlify/functions/expulsoes` em [netlify.toml](../netlify.toml)).
- **Netlify Blobs** — um armazenamento de objetos por site, também do próprio Netlify.
  Dentro de uma função, `getStore()` recebe as credenciais automaticamente do ambiente de
  execução: **não é preciso criar conta em outro serviço, gerar chave nem configurar
  variável de ambiente nenhuma.**

Vantagens para este projeto: zero conta nova, zero segredo para gerenciar, mesma origem
(sem precisar liberar CORS para domínio externo) e zero custo adicional dentro do plano
que já hospeda o site. A contrapartida é que Netlify Blobs é um armazenamento
chave→valor, não um banco relacional com SQL — para o volume e o formato de dados deste
histórico (uma lista, sem relações entre tabelas) isso é suficiente.

## "Schema": formato do registro

Não existe migration para rodar — o Netlify Blobs não tem schema fixo, é um par
chave → valor JSON. Cada expulsão vira **uma chave própria** dentro do store
`expulsoes`, no formato `reg_<epoch em ms>_<8 chars aleatórios>` (o prefixo numérico
ordena os registros por data sem precisar abrir o conteúdo de todos). O valor de cada
chave tem este formato:

```jsonc
{
  "id": "0f2b8e2a-....-....-....-............", // gerado no servidor (crypto.randomUUID)
  "responsavel": "unloav",                       // nick de quem aplicou a expulsão
  "expulso": "fulano123",                        // nick do militar expulso
  "motivo": "Meta semanal não cumprida",         // rótulo completo do motivo
  "motivoCurto": "Meta Semanal",                 // rótulo curto (etiqueta do card)
  "motivoId": "metaSemanal",                     // id do motivo em cartilhas.js
  "bbcode": "[font=Poppins]...[/font]",          // BBCode já gerado, para auditoria/copiar de novo
  "status": "ativo",                             // reservado para uma futura revogação/edição
  "criadoEm": "2026-08-30T14:05:00.000Z",        // ISO 8601, gerado no servidor
  "atualizadoEm": "2026-08-30T14:05:00.000Z"     // igual a criadoEm hoje (não há edição ainda)
}
```

O histórico fica limitado a 300 registros: depois de cada `POST` bem-sucedido, a função
lista as chaves existentes e apaga as mais antigas em excesso (efeito colateral, não
bloqueia a resposta) — mesmo limite que já existia na versão local.

## Concorrência (dois dispositivos gravando "ao mesmo tempo")

Cada `POST` grava numa chave **nova e exclusiva** (`reg_<epoch>_<aleatório>`) — não existe
leitura-e-regravação de uma lista compartilhada, então não existe disputa pela mesma
escrita. Duas expulsões criadas no mesmo milissegundo, em dois dispositivos diferentes,
viram duas chaves diferentes e as duas são preservadas; não há como uma sobrescrever a
outra. (A primeira versão desta função usava uma lista única com escrita condicional por
ETag; o desenho por chave própria é mais simples e evita depender desse mecanismo.)

Não existe checagem de "expulsão repetida" no servidor: o botão **GERAR CARTILHA** fica
desabilitado enquanto o registro está sendo salvo, o que já evita o duplo-clique
acidental. Duas submissões deliberadas com os mesmos nicks e motivo geram dois registros
— comportamento aceitável para um histórico de auditoria.

## Como o front-end lê e grava

Em [sistema-funcionamento/aplicacao.js](../sistema-funcionamento/aplicacao.js), o objeto
`Historico`:

- `Historico.listar()` — `GET /api/expulsoes`, chamado ao abrir a aba **REGISTROS**, ao
  clicar em **atualizar** e depois de registrar uma nova expulsão.
- `Historico.registrar(dados)` — `POST /api/expulsoes` com os dados da cartilha recém
  gerada (incluindo o BBCode, para poder copiar de novo depois).

Não há WebSocket nem polling automático: a lista é buscada nesses três momentos, o que é
suficiente para o volume de uso (expulsões são um evento esporádico, não um chat).

## Variáveis de ambiente necessárias no Netlify

**Nenhuma.** Essa é a principal vantagem de usar Netlify Blobs em vez de um serviço
externo como Supabase: as credenciais de acesso ao store são resolvidas automaticamente
pelo runtime da função, para qualquer site hospedado no Netlify. Não crie nem configure
`SUPABASE_URL`, `SUPABASE_ANON_KEY` ou similares — este projeto não usa esse caminho.

## Ver também

- [SEGURANCA-E-LIMITES.md](SEGURANCA-E-LIMITES.md) — por que não existe exclusão remota.
- [PUBLICAR-NO-NETLIFY.md](PUBLICAR-NO-NETLIFY.md) — como publicar com as functions ativas.
