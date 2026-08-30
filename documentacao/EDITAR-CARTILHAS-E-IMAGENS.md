# Editar cartilhas e imagens

## Textos das cartilhas

Tudo fica em **`sistema-funcionamento/cartilhas.js`**. É o único arquivo com o BBCode.

```js
metaSemanal: {
  id: 'metaSemanal',
  label: 'Meta semanal não cumprida',                      // texto que aparece no seletor
  labelCurto: 'Meta Semanal',                              // etiqueta nos registros
  titulo: '[CS] Notificação de Expulsão — Meta Semanal',   // título copiável
  resumo: '...',                                           // frase da ficha do motivo
  fundamentacao: '...',                                    // base regimental da ficha
  corpo: `  ...texto específico deste motivo, em BBCode...  `
}
```

O BBCode final de cada cartilha é `CABECALHO + corpo + RODAPE`. `CABECALHO` (banner e
saudação) e `RODAPE` (botões de WhatsApp da Liderança e créditos) ficam declarados uma
única vez no topo de `cartilhas.js` — são idênticos nas três cartilhas, então uma
mudança nos botões de contato ou nos créditos vale para todos os motivos de uma vez.

- **Mudar o texto de uma cartilha:** edite só o conteúdo entre as crases do campo `corpo`.
- **Mudar os botões de contato ou os créditos (comuns às três cartilhas):** edite
  `CABECALHO` ou `RODAPE`, no topo do arquivo.
- **Mudar o título copiável:** edite o campo `titulo`.
- **Criar um motivo novo:** copie um bloco inteiro, troque `id`, `label`, `labelCurto`,
  `titulo`, `resumo`, `fundamentacao` e `corpo`, e acrescente o novo `id` na lista
  `ORDEM_MOTIVOS` no fim do arquivo. O seletor se monta sozinho.

> ⚠️ Dentro do BBCode **não use crase (`` ` ``) nem `${`** — os dois quebram a string do
> JavaScript e o site deixa de carregar.

### Substituições automáticas

| Escreva no BBCode | Vira |
|---|---|
| `{USERNAME}` | nick do militar expulso *(é o que as 3 cartilhas usam)* |
| `{RESPONSAVEL}` | nick de quem aplicou a expulsão |
| `{MOTIVO}` | nome do motivo selecionado |
| `{DATA}` | data da geração (dd/mm/aaaa) |
| `{HORA}` | hora da geração (hh:mm) |

Os três modelos atuais são cópia fiel das cartilhas oficiais do CS.

---

## Imagens (`midia-imagens/`)

| Arquivo | Onde aparece |
|---|---|
| `emblema-cs.png` | Emblema grande, atrás do topo do card |
| `fundo-desktop.webp` | Fundo da tela inteira no desktop |
| `icone-cs.png` | Ícone da aba do navegador (favicon) |
| `originais/` | Arquivos pesados de origem — não vão para o site publicado |

### Trocar o emblema
Substitua `emblema-cs.png` mantendo o nome. Use fundo transparente, formato próximo do
quadrado. Se o arquivo sumir, a página apenas esconde o espaço — não aparece imagem
quebrada.

### Trocar o fundo
Substitua `fundo-desktop.webp` mantendo o nome. Ideal: **2560 × 1440 (16:9)** com o centro
mais limpo, porque o card fica por cima. O fundo é preso à tela: preenche tudo, não repete,
não distorce e não se mexe com rolagem ou zoom. No celular ele nem é carregado — fica só o
fundo escuro liso.

Se preferir outro formato (`.png`, `.jpg`), ajuste a linha `background-image` no bloco
*Fundo do desktop* de `design-visual/estilos.css`.

> Imagem pesada deixa o site lento. O fundo original tinha 7 MB e foi convertido para
> 100 KB em WebP; o emblema saiu de 455 KB para 69 KB.

---

## Cores e tamanhos

Estão no topo de **`design-visual/estilos.css`**, em `:root`:

```css
--verde:        #339900;   /* verde principal do CS */
--verde-claro:  #7ede2a;   /* detalhes e destaques */
--fundo:        #1a1a1a;   /* fundo da página */
--painel:       #222222;   /* card do gerador */
```

Depois de editar CSS ou JavaScript, aumente o número do `?v=` nos links dentro do
`index.html` (`?v=6` → `?v=7`). Isso obriga o navegador de todo mundo a baixar a versão
nova em vez de usar a antiga guardada em cache.
